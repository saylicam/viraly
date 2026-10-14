import { db } from '../firebase';
import type { TrendsSnapshot, TrendSound } from './trends';

/**
 * Notification hebdomadaire « tendances » via le service de notifications d'Expo.
 * Les jetons sont enregistrés par l'app dans users/{uid}.expoPushToken (Firestore).
 * Le message est personnalisé selon la première niche de l'utilisateur.
 */

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.', ',')} M` :
  n >= 1_000 ? `${Math.round(n / 1_000)} k` : String(n);

/**
 * 3 rendez-vous par semaine (heure de Paris), pour TOUS les comptes qui ont accepté les
 * notifications, gratuits compris : la notification ouvre l'onglet Tendances, où un compte
 * gratuit découvre ce qui est sous cadenas.
 *  - slot 0 : juste après la collecte (lundi)  → « les tendances de la semaine sont là »
 *  - slot 1 : jeudi 18 h                        → un son qui explose + la vidéo qui a cartonné avec
 *  - slot 2 : samedi 11 h                       → une idée de vidéo (format) pour le week-end
 */
export type PushSlot = 0 | 1 | 2;

const pool = <T extends { niches: string[] }>(items: T[], niche?: string) => {
  const own = niche ? items.filter((i) => i.niches.includes(niche)) : [];
  return own.length ? own : items;
};

/** Son mis en avant : différent pour chaque rendez-vous de la semaine. */
const soundFor = (snap: TrendsSnapshot, niche: string | undefined, slot: PushSlot): TrendSound | undefined => {
  const list = pool(snap.sounds, niche);
  if (slot === 0) return list.find((s) => s.status === 'exploding') ?? list.find((s) => s.notYetInFrance) ?? list[0];
  return list[Math.min(slot, list.length - 1)] ?? list[0];
};

export const messageFor = (snap: TrendsSnapshot, niche?: string, slot: PushSlot = 0) => {
  if (slot === 2) {
    const f = pool(snap.formats ?? [], niche)[0] ?? pool(snap.videos, niche)[0];
    if (f && f.views > 0) {
      return {
        title: '💡 Ton idée de vidéo du week-end',
        body: `@${f.author} a fait ${fmt(f.views)} vues avec ce format. Refais-le à ta façon en 2 minutes avec Viraly.`,
      };
    }
  }
  const s = soundFor(snap, niche, slot);
  if (!s) return null;
  if (slot === 1) {
    const views = s.topVideo?.views ?? 0;
    return {
      title: '🎵 Ce son est en train d’exploser',
      body: views > 0 && s.topVideo
        ? `@${s.topVideo.author} a fait ${fmt(views)} vues avec « ${s.title} ». Fais pareil avant qu’il soit saturé.`
        : `« ${s.title} » monte en flèche cette semaine. Fais ta version avant qu’il soit saturé.`,
    };
  }
  let body: string;
  if (s.status === 'exploding' && s.growthPct != null) {
    body = `« ${s.title} » explose : +${s.growthPct} % de vidéos en une semaine.`;
  } else if (s.notYetInFrance) {
    body = `« ${s.title} » cartonne aux États-Unis et n'est pas encore arrivé en France. Prends de l'avance.`;
  } else {
    body = `« ${s.title} » est le son de la semaine.`;
  }
  if (s.topVideo && s.topVideo.views > 0) {
    body += ` @${s.topVideo.author} a fait ${fmt(s.topVideo.views)} vues avec.`;
  }
  return { title: '🔥 Les tendances de la semaine sont là', body };
};

export const sendTrendsPush = async (snap: TrendsSnapshot, slot: PushSlot = 0) => {
  if (!db) {
    console.warn('ℹ️ Notifications non envoyées : FIREBASE_SERVICE_ACCOUNT non configuré');
    return { sent: 0 };
  }
  const users = await db.collection('users').where('notificationsEnabled', '==', true).get();
  const messages: any[] = [];
  users.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const u = doc.data();
    const token: string | undefined = u.expoPushToken;
    if (!token || !token.startsWith('ExponentPushToken')) return;
    const msg = messageFor(snap, Array.isArray(u.niches) ? u.niches[0] : undefined, slot);
    if (!msg) return;
    messages.push({ to: token, sound: 'default', title: msg.title, body: msg.body, data: { screen: 'Trends' } });
  });

  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      if (res.ok) sent += batch.length;
      else console.warn(`⚠️ Envoi des notifications : HTTP ${res.status}`);
    } catch (e: any) {
      console.warn('⚠️ Envoi des notifications impossible:', e?.message);
    }
  }
  console.log(`🔔 Notifications tendances (rendez-vous ${slot}) envoyées : ${sent}/${messages.length}`);
  return { sent };
};

/** Compatibilité : notification envoyée juste après la collecte. */
export const sendWeeklyTrendsPush = (snap: TrendsSnapshot) => sendTrendsPush(snap, 0);

// ---------- Rendez-vous du jeudi et du samedi ----------

/** Jour (0 = dimanche) et heure à Paris. */
const parisNow = () => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', hour12: false }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd), hour };
};

const sentSlots = new Set<string>();

/** Appelé toutes les heures : envoie le rendez-vous du moment s'il n'est pas déjà parti. */
export const sendScheduledPush = async (snap: TrendsSnapshot | null) => {
  if (!snap) return;
  const { day, hour } = parisNow();
  const slot: PushSlot | null = day === 4 && hour === 18 ? 1 : day === 6 && hour === 11 ? 2 : null;
  if (slot == null) return;
  const key = `${snap.weekId}-${slot}`;
  if (sentSlots.has(key)) return;
  if (db) {
    const ref = db.collection('meta').doc('pushLog');
    const done = (await ref.get()).get(key);
    if (done) { sentSlots.add(key); return; }
    await ref.set({ [key]: new Date().toISOString() }, { merge: true });
  }
  sentSlots.add(key);
  await sendTrendsPush(snap, slot);
};

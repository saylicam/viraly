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

const headlineFor = (snap: TrendsSnapshot, niche?: string): TrendSound | undefined => {
  const pool = niche ? snap.sounds.filter((s) => s.niches.includes(niche)) : [];
  const list = pool.length ? pool : snap.sounds;
  return list.find((s) => s.status === 'exploding') ?? list.find((s) => s.notYetInFrance) ?? list[0];
};

export const messageFor = (snap: TrendsSnapshot, niche?: string) => {
  const s = headlineFor(snap, niche);
  if (!s) return null;
  let body: string;
  if (s.status === 'exploding' && s.growthPct != null) {
    body = `« ${s.title} » explose : +${s.growthPct} % de vidéos en une semaine.`;
  } else if (s.notYetInFrance) {
    body = `« ${s.title} » cartonne aux États-Unis et n'est pas encore arrivé en France. Prends de l'avance.`;
  } else {
    body = `« ${s.title} » est le son de la semaine.`;
  }
  if (s.topVideo && s.topVideo.views > 0) {
    body += ` @${s.topVideo.author} a fait ${fmt(s.topVideo.views)} de vues avec.`;
  }
  return { title: '🔥 Les tendances de la semaine sont là', body };
};

export const sendWeeklyTrendsPush = async (snap: TrendsSnapshot) => {
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
    const msg = messageFor(snap, Array.isArray(u.niches) ? u.niches[0] : undefined);
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
  console.log(`🔔 Notifications tendances envoyées : ${sent}/${messages.length}`);
  return { sent };
};

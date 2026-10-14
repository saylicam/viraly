/**
 * Envoie UNE notification de test au dernier téléphone qui a activé les notifications
 * (le tien juste après avoir accepté dans Viraly Dev). N'envoie rien aux autres comptes.
 * Usage (dans src/server) :  npx tsx scripts/test-push.ts [1|2]   (rendez-vous à simuler, 1 par défaut)
 */
import 'dotenv/config';
import { db } from '../src/firebase';
import { loadLatestTrends } from '../src/services/trends';
import { messageFor, type PushSlot } from '../src/services/push';

(async () => {
  if (!db) throw new Error('FIREBASE_SERVICE_ACCOUNT absent du .env du serveur');
  const slot = (Number(process.argv[2] ?? 1) as PushSlot);
  const users = await db.collection('users').where('notificationsEnabled', '==', true).get();
  const list = users.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((u) => typeof u.expoPushToken === 'string' && u.expoPushToken.startsWith('ExponentPushToken'))
    .sort((a, b) => String(b.notificationsUpdatedAt ?? '').localeCompare(String(a.notificationsUpdatedAt ?? '')));
  console.log(`Comptes avec notifications activées : ${list.length}`);
  const me = list[0];
  if (!me) { console.log('Aucun téléphone enregistré. Ouvre Viraly Dev et accepte les notifications.'); process.exit(0); }
  console.log(`Envoi à : ${me.name ?? me.displayName ?? me.id} (activé le ${me.notificationsUpdatedAt})`);

  const snap = await loadLatestTrends();
  const msg = (snap && messageFor(snap, Array.isArray(me.niches) ? me.niches[0] : undefined, slot))
    ?? { title: '🔔 Test Viraly', body: 'Les notifications marchent !' };
  console.log(`Message : ${msg.title} — ${msg.body}`);

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify([{ to: me.expoPushToken, sound: 'default', title: msg.title, body: msg.body, data: { screen: 'Trends' } }]),
  });
  console.log('Réponse Expo :', JSON.stringify(await res.json()));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

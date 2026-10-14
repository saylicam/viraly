/**
 * Avant un envoi à Apple : rend l'analyse offerte au compte de démo des examinateurs.
 * Usage (dans src/server) :  npx tsx scripts/reset-demo.ts [email]
 */
import 'dotenv/config';
import fs from 'fs';
import os from 'os';
import path from 'path';

const EMAIL = process.argv[2] ?? 'nassiriilyase+review@gmail.com';

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  for (const dir of [path.join(os.homedir(), 'Downloads'), process.cwd()]) {
    try {
      const f = fs.readdirSync(dir).find((n) => n.includes('firebase-adminsdk') && n.endsWith('.json'));
      if (f) { process.env.FIREBASE_SERVICE_ACCOUNT = fs.readFileSync(path.join(dir, f), 'utf8'); break; }
    } catch {}
  }
}

(async () => {
  const { db, firebaseApp } = await import('../src/firebase');
  const { getAuth } = await import('firebase-admin/auth');
  if (!db) throw new Error('Compte de service Firebase introuvable (fichier *firebase-adminsdk*.json dans Téléchargements)');
  const user = await getAuth(firebaseApp).getUserByEmail(EMAIL);
  const before = (await db.collection('usage').doc(user.uid).get()).data();
  await db.collection('usage').doc(user.uid).delete();
  const profile = (await db.collection('users').doc(user.uid).get()).exists;
  console.log(`Compte de démo : ${EMAIL} (${user.uid})`);
  console.log(`Compteur avant : ${JSON.stringify(before ?? {})} → remis à zéro`);
  console.log(`Profil déjà rempli : ${profile ? 'oui' : 'non (l’examinateur fera le questionnaire)'}`);
  process.exit(0);
})().catch((e) => { console.error(e?.message ?? e); process.exit(1); });

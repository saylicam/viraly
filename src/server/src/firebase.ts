import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { env } from './env';

/**
 * Initialisation unique de Firebase Admin.
 * - Sans compte de service : seule la vérification des connexions fonctionne (verifyIdToken).
 * - Avec FIREBASE_SERVICE_ACCOUNT (JSON du compte de service, collé tel quel ou en base64) :
 *   le serveur peut aussi lire/écrire Firestore (tendances, jetons de notification).
 */
const parseServiceAccount = (): Record<string, any> | null => {
  const raw = env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT illisible (JSON ou base64 attendu)');
    return null;
  }
};

const serviceAccount = parseServiceAccount();

export const firebaseApp: App =
  getApps()[0] ??
  initializeApp(
    serviceAccount
      ? { credential: cert(serviceAccount as any), projectId: env.FIREBASE_PROJECT_ID }
      : { projectId: env.FIREBASE_PROJECT_ID }
  );

/** Firestore n'est disponible que si le compte de service est configuré. */
export const db: Firestore | null = serviceAccount ? getFirestore(firebaseApp) : null;

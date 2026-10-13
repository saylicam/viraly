import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase';
import { env } from '../env';

/**
 * Analyses offertes aux comptes gratuits : FREE_ANALYSES_TOTAL au total (pas par jour).
 * Compté dans Firestore (collection « usage », inaccessible depuis l'app) pour résister
 * aux redémarrages du serveur et aux réinstallations de l'app.
 * Sans compte de service Firebase (serveur du PC), on compte en mémoire.
 */
const memory = new Map<string, number>();
const ref = (uid: string) => db!.collection('usage').doc(uid);

export const freeAnalysesUsed = async (uid: string): Promise<number> => {
  if (!db) return memory.get(uid) ?? 0;
  const snap = await ref(uid).get();
  return Number(snap.get('analyses') ?? 0);
};

export const freeAnalysesLeft = async (uid: string) =>
  Math.max(0, env.FREE_ANALYSES_TOTAL - (await freeAnalysesUsed(uid)));

/** Réserve une analyse offerte. false si elles sont épuisées. */
export const consumeFreeAnalysis = async (uid: string): Promise<boolean> => {
  if (!db) {
    const used = memory.get(uid) ?? 0;
    if (used >= env.FREE_ANALYSES_TOTAL) return false;
    memory.set(uid, used + 1);
    return true;
  }
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref(uid));
    const used = Number(snap.get('analyses') ?? 0);
    if (used >= env.FREE_ANALYSES_TOTAL) return false;
    tx.set(ref(uid), { analyses: used + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
};

/** Rend l'analyse quand l'IA a échoué (l'utilisateur n'a rien reçu). */
export const refundFreeAnalysis = async (uid: string) => {
  if (!db) {
    const used = memory.get(uid) ?? 0;
    if (used > 0) memory.set(uid, used - 1);
    return;
  }
  await ref(uid).set({ analyses: FieldValue.increment(-1) }, { merge: true }).catch(() => {});
};

export const FREE_LIMIT_MESSAGE =
  'Tu as utilisé ton analyse offerte. Passe à Premium pour analyser toutes tes vidéos, sans limite.';

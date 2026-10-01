import type { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from '../env';

/**
 * Vérification des jetons Firebase.
 * Pas besoin de compte de service : verifyIdToken n'a besoin que de l'ID du projet
 * (il télécharge les clés publiques de Google pour vérifier la signature).
 */
if (getApps().length === 0) {
  initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
}

export interface AuthedRequest extends Request {
  uid?: string;
  isPremium?: boolean;
}

/** Refuse la requête si l'utilisateur n'envoie pas un jeton Firebase valide. */
export const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'AUTH_REQUIRED',
      message: 'Connecte-toi pour analyser une vidéo.',
    });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'AUTH_INVALID',
      message: 'Ta session a expiré. Reconnecte-toi puis réessaie.',
    });
  }
};

// Petit cache pour ne pas interroger RevenueCat à chaque requête
const subscriptionCache = new Map<string, { active: boolean; checkedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const hasActiveEntitlement = async (uid: string): Promise<boolean> => {
  const cached = subscriptionCache.get(uid);
  if (cached && cached.active && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return cached.active;
  }

  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
    headers: {
      Authorization: `Bearer ${env.REVENUECAT_SECRET_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`RevenueCat a répondu ${response.status}`);
  }

  const data: any = await response.json();
  const entitlement = data?.subscriber?.entitlements?.[env.REVENUECAT_ENTITLEMENT_ID];
  const active =
    !!entitlement &&
    (entitlement.expires_date === null || new Date(entitlement.expires_date).getTime() > Date.now());

  // On ne garde en cache que le statut « abonné » : un utilisateur qui vient
  // de s'abonner doit être reconnu immédiatement.
  if (active) {
    subscriptionCache.set(uid, { active, checkedAt: Date.now() });
  } else {
    subscriptionCache.delete(uid);
    console.log(`ℹ️ ${uid} : pas d'abonnement actif chez RevenueCat`);
  }
  return active;
};

// Analyses gratuites : nombre par utilisateur et par jour (en mémoire, remis à zéro au redémarrage)
const freeUsage = new Map<string, { day: string; count: number }>();

const today = () => new Date().toISOString().slice(0, 10);

const consumeFreeAnalysis = (uid: string): boolean => {
  const day = today();
  const entry = freeUsage.get(uid);
  const count = entry && entry.day === day ? entry.count : 0;
  if (count >= env.FREE_ANALYSES_PER_DAY) return false;
  freeUsage.set(uid, { day, count: count + 1 });
  return true;
};

/**
 * Détermine si l'utilisateur est abonné (req.isPremium).
 * - Abonné : analyse complète, sans limite.
 * - Non abonné : analyse partielle (le détail est réservé à Premium),
 *   limitée à FREE_ANALYSES_PER_DAY par jour pour maîtriser le coût.
 */
export const checkSubscription = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (env.REQUIRE_SUBSCRIPTION === 'false') {
    req.isPremium = true;
    return next();
  }

  try {
    req.isPremium = await hasActiveEntitlement(req.uid as string);
  } catch (error) {
    console.error('❌ Vérification abonnement impossible:', error);
    return res.status(503).json({
      success: false,
      error: 'SUBSCRIPTION_CHECK_FAILED',
      message: "Impossible de vérifier ton abonnement pour le moment. Réessaie dans un instant.",
    });
  }

  // Seul l'envoi d'une vidéo consomme une analyse gratuite
  const isAnalysis = req.method === 'POST';
  if (!req.isPremium && isAnalysis && !consumeFreeAnalysis(req.uid as string)) {
    return res.status(429).json({
      success: false,
      error: 'FREE_LIMIT_REACHED',
      message: `Tu as utilisé tes ${env.FREE_ANALYSES_PER_DAY} analyses gratuites du jour. Passe à Premium pour analyser sans limite.`,
    });
  }

  next();
};

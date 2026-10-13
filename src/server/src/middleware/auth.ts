import type { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { env } from '../env';
import { firebaseApp } from '../firebase';
import { consumeFreeAnalysis, FREE_LIMIT_MESSAGE } from '../services/freeQuota';

/**
 * Vérification des jetons Firebase.
 * verifyIdToken n'a besoin que de l'ID du projet (il télécharge les clés publiques
 * de Google pour vérifier la signature) : voir ../firebase.ts.
 */

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
    const decoded = await getAuth(firebaseApp).verifyIdToken(token);
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

export const hasActiveEntitlement = async (uid: string): Promise<boolean> => {
  // Mode test du PC : on simule le statut sans RevenueCat
  if (env.TEST_PLAN) return env.TEST_PLAN === 'premium';

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

/**
 * Détermine si l'utilisateur est abonné (req.isPremium).
 * - Abonné : analyse complète, sans limite.
 * - Non abonné : FREE_ANALYSES_TOTAL analyse(s) offerte(s) au total, en version partielle
 *   (le détail est réservé à Premium), puis écran Premium.
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
  if (!req.isPremium && isAnalysis && !(await consumeFreeAnalysis(req.uid as string))) {
    return res.status(429).json({ success: false, error: 'FREE_LIMIT_REACHED', message: FREE_LIMIT_MESSAGE });
  }

  next();
};

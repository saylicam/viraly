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
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
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

  subscriptionCache.set(uid, { active, checkedAt: Date.now() });
  return active;
};

/** Refuse la requête si l'utilisateur n'a pas d'abonnement Premium actif. */
export const requireSubscription = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (env.REQUIRE_SUBSCRIPTION === 'false') {
    return next();
  }

  try {
    const active = await hasActiveEntitlement(req.uid as string);
    if (!active) {
      return res.status(403).json({
        success: false,
        error: 'SUBSCRIPTION_REQUIRED',
        message: 'Cette fonctionnalité est réservée aux abonnés Viraly Premium.',
      });
    }
    next();
  } catch (error) {
    console.error('❌ Vérification abonnement impossible:', error);
    return res.status(503).json({
      success: false,
      error: 'SUBSCRIPTION_CHECK_FAILED',
      message: "Impossible de vérifier ton abonnement pour le moment. Réessaie dans un instant.",
    });
  }
};

import express from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../env';
import { requireAuth, hasActiveEntitlement, type AuthedRequest } from '../middleware/auth';
import { normalizeHandle, previewAccount, auditAccount, getCachedAudit, freeAuditView, AccountError } from '../services/accountAudit';

const router = express.Router();

const NICHE_KEYS = ['comedy', 'music', 'beauty', 'education', 'gaming', 'fitness', 'tech', 'food', 'travel', 'lifestyle'];
const GOAL_KEYS = ['views', 'engagement', 'fanbase', 'monetization'];

const sendError = (res: express.Response, e: any) => {
  if (e instanceof AccountError) {
    const status = e.code === 'UNAVAILABLE' ? 503 : e.code === 'NOT_FOUND' ? 404 : 422;
    return res.status(status).json({ success: false, error: e.code, message: e.message });
  }
  if (String(e?.message).includes('SOCIAVAULT_API_KEY')) {
    return res.status(503).json({ success: false, error: 'UNAVAILABLE', message: 'Le bilan de compte arrive très bientôt.' });
  }
  console.error('❌ Bilan compte :', e?.message);
  return res.status(502).json({ success: false, error: 'AUDIT_FAILED', message: "L'IA n'a pas réussi à faire ton bilan. Réessaie dans un instant." });
};

/**
 * GET /api/account/preview?handle=nom
 * Aperçu du compte (photo, nom, abonnés) pendant l'inscription, avant la création du compte Viraly.
 * Sans connexion : limité par adresse IP et mis en cache 24 h (1 crédit SociaVault par nouveau pseudo).
 */
const previewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'RATE_LIMITED', message: 'Trop de recherches, réessaie un peu plus tard.' },
});
router.get('/preview', previewLimiter, async (req, res) => {
  const handle = normalizeHandle(req.query.handle);
  if (!handle) return res.status(400).json({ success: false, error: 'INVALID_HANDLE', message: 'Ce pseudo TikTok ne semble pas valide.' });
  try {
    const profile = await previewAccount(handle);
    res.json({ success: true, data: profile });
  } catch (e) {
    sendError(res, e);
  }
});

// Nouveaux bilans par jour (un bilan déjà en cache ne compte pas)
const FREE_AUDITS_PER_DAY = 1;
const PREMIUM_AUDITS_PER_DAY = 5;
const usage = new Map<string, { day: string; count: number }>();
const today = () => new Date().toISOString().slice(0, 10);

/**
 * POST /api/account/audit { handle, niche?, goal?, refresh? }
 * Bilan complet du compte + fiche créateur. Complet pour Premium, aperçu sinon.
 */
router.post('/audit', requireAuth, async (req: AuthedRequest, res) => {
  const handle = normalizeHandle(req.body?.handle);
  if (!handle) return res.status(400).json({ success: false, error: 'INVALID_HANDLE', message: 'Ce pseudo TikTok ne semble pas valide.' });
  const niche = NICHE_KEYS.includes(req.body?.niche) ? req.body.niche : undefined;
  const goal = GOAL_KEYS.includes(req.body?.goal) ? req.body.goal : undefined;

  let isPremium = env.REQUIRE_SUBSCRIPTION === 'false';
  if (!isPremium) {
    try {
      isPremium = await hasActiveEntitlement(req.uid as string);
    } catch {
      isPremium = false;
    }
  }

  // Actualisation forcée réservée à Premium ; sinon on réutilise le bilan du jour
  const force = isPremium && req.body?.refresh === true;
  const cached = force ? null : getCachedAudit(handle);
  if (!cached) {
    const day = today();
    const entry = usage.get(req.uid as string);
    const count = entry && entry.day === day ? entry.count : 0;
    const max = isPremium ? PREMIUM_AUDITS_PER_DAY : FREE_AUDITS_PER_DAY;
    if (count >= max) {
      return res.status(429).json({
        success: false,
        error: 'AUDIT_LIMIT',
        message: isPremium ? 'Tu as fait beaucoup de bilans aujourd’hui : réessaie demain.' : 'Ton bilan gratuit du jour est déjà fait. Passe à Premium pour l’actualiser quand tu veux.',
      });
    }
    usage.set(req.uid as string, { day, count: count + 1 });
  }

  try {
    const audit = cached ?? (await auditAccount(handle, { niche, goal }, force));
    res.json({ success: true, data: isPremium ? { ...audit, limited: false } : freeAuditView(audit) });
  } catch (e) {
    // Rien reçu : le bilan n'est pas décompté
    if (!cached) {
      const entry = usage.get(req.uid as string);
      if (entry && entry.count > 0) entry.count--;
    }
    sendError(res, e);
  }
});

export default router;

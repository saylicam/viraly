import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import multer from 'multer';
import { env } from '../env';
import { requireAuth, hasActiveEntitlement, type AuthedRequest } from '../middleware/auth';
import { consumeFreeAnalysis, refundFreeAnalysis, FREE_LIMIT_MESSAGE } from '../services/freeQuota';
import { loadLatestTrends, loadCover, trendsForNiche, NICHES } from '../services/trends';
import { runTrendsCycle } from '../jobs/weeklyTrends';
import { findTrendItem, generateRemix, describe } from '../services/remix';
import { checkTrendVideo, sanitizePlan } from '../services/trendCheck';
import { sanitizeCard } from '../services/accountAudit';

const router = express.Router();

/** Nombre d'éléments visibles sans abonnement : tout le reste est sous cadenas dans l'app. */
const FREE_SOUNDS = 2;
const FREE_VIDEOS = 1;
const FREE_HASHTAGS = 0;

/**
 * GET /api/trends?niche=gaming
 * Tendances de la semaine pour une niche. Aperçu limité sans Premium.
 */
router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const niche = typeof req.query.niche === 'string' && (NICHES as readonly string[]).includes(req.query.niche)
    ? req.query.niche
    : undefined;

  const snapshot = await loadLatestTrends();
  if (!snapshot) {
    return res.json({ success: true, data: null, message: 'Les tendances de la semaine arrivent bientôt.' });
  }

  let isPremium = env.REQUIRE_SUBSCRIPTION === 'false';
  if (!isPremium) {
    try {
      isPremium = await hasActiveEntitlement(req.uid as string);
    } catch {
      isPremium = false; // en cas de souci RevenueCat, on montre l'aperçu plutôt qu'une erreur
    }
  }

  const view = trendsForNiche(snapshot, niche);
  if (isPremium) {
    return res.json({ success: true, data: { ...view, niche: niche ?? 'all', limited: false } });
  }

  // Version gratuite : les MEILLEURES places du classement sont sous cadenas (floutées),
  // et ce sont des places plus basses qui restent visibles (ex. 8e et 9e sons).
  // On envoie seulement miniature + vues + rang pour les éléments cachés.
  const preview = (x: any, rank: number) => ({
    rank, cover: x.cover ?? x.topVideo?.cover ?? null, views: x.views ?? x.topVideo?.views ?? x.totalViews ?? null, market: x.market ?? (x.markets?.includes?.('FR') ? 'FR' : x.markets ? 'US' : undefined),
  });
  const soundsTop = view.sounds.slice(0, 10);
  const freeSoundsFrom = Math.max(0, soundsTop.length - FREE_SOUNDS);
  const videosTop = view.videos.slice(0, 6);
  const freeVideosFrom = Math.max(0, videosTop.length - FREE_VIDEOS);

  return res.json({
    success: true,
    data: {
      ...view,
      niche: niche ?? 'all',
      limited: true,
      lockedCounts: {
        sounds: freeSoundsFrom,
        videos: freeVideosFrom,
        notYetInFrance: view.notYetInFrance.length,
        formats: view.formats.length,
        hashtags: Math.max(0, view.hashtags.length - FREE_HASHTAGS),
      },
      sounds: soundsTop.slice(freeSoundsFrom).map((x: any, i: number) => ({ ...x, rank: freeSoundsFrom + i + 1 })),
      videos: videosTop.slice(freeVideosFrom).map((x: any, i: number) => ({ ...x, rank: freeVideosFrom + i + 1 })),
      previews: {
        videos: videosTop.slice(0, freeVideosFrom).map((v: any, i: number) => preview(v, i + 1)),
        sounds: soundsTop.slice(0, freeSoundsFrom).map((x: any, i: number) => preview(x, i + 1)),
        ahead: view.notYetInFrance.slice(0, 6).map((x: any, i: number) => preview(x, i + 1)),
        formats: view.formats.slice(0, 6).map((v: any, i: number) => preview(v, i + 1)),
      },
      notYetInFrance: [],
      formats: [],
      hashtags: view.hashtags.slice(0, FREE_HASHTAGS),
      genericHashtags: [],
    },
  });
});

// Plans de tournage gratuits par jour pour un non-abonné (en mémoire)
const FREE_REMIX_PER_DAY = 1;
const freeRemix = new Map<string, { day: string; count: number }>();

/**
 * POST /api/trends/remix { kind: 'sound' | 'video', id, niche?, level? }
 * « Refais cette tendance à ta façon » : plan de tournage personnalisé.
 * Illimité pour Premium, 1 par jour sinon.
 */
router.post('/remix', requireAuth, async (req: AuthedRequest, res) => {
  const { kind, id, niche, level, creator } = req.body ?? {};
  if ((kind !== 'sound' && kind !== 'video') || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Tendance introuvable.' });
  }
  const snapshot = await loadLatestTrends();
  const item = snapshot ? findTrendItem(snapshot, kind, id) : null;
  if (!item) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Cette tendance n’est plus disponible.' });
  }

  let isPremium = env.REQUIRE_SUBSCRIPTION === 'false';
  if (!isPremium) {
    try { isPremium = await hasActiveEntitlement(req.uid as string); } catch { isPremium = false; }
  }
  if (!isPremium) {
    const day = new Date().toISOString().slice(0, 10);
    const entry = freeRemix.get(req.uid as string);
    const count = entry && entry.day === day ? entry.count : 0;
    if (count >= FREE_REMIX_PER_DAY) {
      return res.status(429).json({
        success: false,
        error: 'FREE_LIMIT_REACHED',
        message: 'Tu as utilisé ton plan gratuit du jour. Passe à Premium pour en générer sans limite.',
      });
    }
    freeRemix.set(req.uid as string, { day, count: count + 1 });
  }

  try {
    const plan = await generateRemix(
      kind,
      item as any,
      typeof niche === 'string' ? niche : undefined,
      typeof level === 'string' ? level : undefined,
      sanitizeCard(creator)
    );
    return res.json({ success: true, data: plan });
  } catch (e: any) {
    console.error('❌ Plan de tendance impossible:', e?.message ?? e);
    // L'échec ne doit pas consommer le plan gratuit du jour
    const entry = freeRemix.get(req.uid as string);
    if (!isPremium && entry && entry.count > 0) entry.count--;
    return res.status(502).json({ success: false, error: 'AI_FAILED', message: 'L’IA n’a pas pu préparer ton plan. Réessaie.' });
  }
});

// Vidéos envoyées pour « Vérifie ma version » : fichier temporaire, supprimé juste après
const checkUpload = multer({
  dest: path.join(os.tmpdir(), 'viraly-checks'),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('video/')),
});

/**
 * POST /api/trends/check (multipart : video, plan, kind?, id?)
 * « Vérifie ma version » : compare la vidéo tournée au plan de tendance.
 * Illimité pour Premium ; sinon compte comme une des analyses gratuites du jour.
 */
router.post('/check', requireAuth, checkUpload.single('video'), async (req: AuthedRequest, res) => {
  const file = req.file;
  const cleanup = () => { if (file) fs.promises.unlink(file.path).catch(() => {}); };

  if (!file) {
    return res.status(400).json({ success: false, error: 'NO_VIDEO_FILE', message: 'Choisis une vidéo à vérifier.' });
  }
  const plan = sanitizePlan(req.body?.plan);
  if (!plan) {
    cleanup();
    return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Plan de tournage introuvable.' });
  }
  if (!env.GEMINI_API_KEY) {
    cleanup();
    return res.status(500).json({ success: false, error: 'GEMINI_NOT_INITIALIZED', message: 'Service indisponible.' });
  }

  let isPremium = env.REQUIRE_SUBSCRIPTION === 'false';
  if (!isPremium) {
    try { isPremium = await hasActiveEntitlement(req.uid as string); } catch { isPremium = false; }
  }
  if (!isPremium && !(await consumeFreeAnalysis(req.uid as string))) {
    cleanup();
    return res.status(429).json({ success: false, error: 'FREE_LIMIT_REACHED', message: FREE_LIMIT_MESSAGE });
  }

  // Contexte de la tendance d'origine, si elle est encore dans le classement de la semaine
  let trendDescription: string | undefined;
  const { kind, id } = req.body ?? {};
  if ((kind === 'sound' || kind === 'video') && typeof id === 'string') {
    const snapshot = await loadLatestTrends().catch(() => null);
    const item = snapshot ? findTrendItem(snapshot, kind, id) : null;
    if (item) trendDescription = describe(kind, item as any);
  }

  try {
    const result = await checkTrendVideo(file.path, file.mimetype, plan, trendDescription, sanitizeCard(req.body?.creator));
    return res.json({ success: true, data: result });
  } catch (e: any) {
    console.error('❌ Vérification de tendance impossible:', e?.message ?? e);
    if (!isPremium) refundFreeAnalysis(req.uid as string);
    return res.status(502).json({ success: false, error: 'AI_FAILED', message: 'L’IA n’a pas pu vérifier ta vidéo. Réessaie.' });
  } finally {
    cleanup();
  }
});

/** GET /api/trends/cover/:key — miniatures copiées lors de la collecte (publiques, mises en cache). */
router.get('/cover/:key', async (req, res) => {
  try {
    const cover = await loadCover(req.params.key);
    if (!cover) return res.status(404).end();
    res.set('Content-Type', cover.type);
    res.set('Cache-Control', 'public, max-age=604800, immutable');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.send(cover.data);
  } catch {
    return res.status(500).end();
  }
});

/** POST /api/trends/refresh — collecte manuelle (en-tête x-admin-token). */
router.post('/refresh', async (req, res) => {
  if (!env.ADMIN_TOKEN || req.headers['x-admin-token'] !== env.ADMIN_TOKEN) {
    return res.status(403).json({ success: false, error: 'FORBIDDEN' });
  }
  res.json({ success: true, message: 'Collecte lancée' });
  runTrendsCycle().catch((e) => console.error('❌ Collecte manuelle échouée:', e?.message ?? e));
});

export default router;

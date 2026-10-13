import fs from 'fs';
import path from 'path';
import { db } from '../firebase';
import { sociavault, extractVideos } from './sociavault';

/**
 * Tendances de la semaine.
 * Le classement officiel de TikTok (Creative Center) étant instable, on calcule nos propres
 * tendances : recherches de la semaine (vidéos les plus likées) aux États-Unis — où naissent
 * la plupart des tendances — et en France, pour chaque niche de l'app. On repère les sons qui
 * reviennent, leur nombre total de vidéos, et leur croissance d'une semaine à l'autre.
 * Coût : ~40 crédits SociaVault par collecte (une fois par semaine).
 */

export type Market = 'US' | 'FR';
export const NICHES = ['comedy', 'music', 'beauty', 'education', 'gaming', 'fitness', 'tech', 'food', 'travel'] as const;
export type Niche = (typeof NICHES)[number];

/**
 * Requêtes par niche : [marché, mot-clé]. Deux mots-clés par marché et par niche pour
 * avoir assez de contenu propre à chaque niche ; une recherche vide est simplement ignorée.
 * "general" = tendances toutes niches confondues (ne sert qu'à compléter une niche).
 */
const QUERIES: Record<Niche | 'general', [Market, string][]> = {
  general: [['US', 'trend'], ['US', 'dance challenge'], ['FR', 'tendance'], ['FR', 'pourtoi']],
  comedy: [['US', 'comedy'], ['US', 'funny skit'], ['FR', 'humour'], ['FR', 'sketch drôle']],
  music: [['US', 'singing'], ['US', 'cover song'], ['FR', 'chanson'], ['FR', 'chanteur']],
  beauty: [['US', 'makeup'], ['US', 'skincare routine'], ['FR', 'maquillage'], ['FR', 'beauté']],
  education: [['US', 'did you know'], ['US', 'life hack'], ['FR', 'astuce'], ['FR', 'le saviez-vous']],
  gaming: [['US', 'gaming'], ['US', 'fortnite'], ['FR', 'gaming'], ['FR', 'jeux vidéo']],
  fitness: [['US', 'gym'], ['US', 'workout'], ['FR', 'musculation'], ['FR', 'sport maison']],
  tech: [['US', 'tech'], ['US', 'iphone tips'], ['FR', 'tech'], ['FR', 'astuce iphone']],
  food: [['US', 'recipe'], ['US', 'easy dinner'], ['FR', 'recette'], ['FR', 'cuisine facile']],
  travel: [['US', 'travel'], ['US', 'travel vlog'], ['FR', 'voyage'], ['FR', 'vacances']],
};

/** En dessous, une vidéo ou un son n'est pas une « tendance » (filtre le bruit). */
const MIN_VIDEO_VIEWS = 20_000;
const MIN_SOUND_VIEWS = 50_000;

/** Hashtags trop larges pour aider à cibler : affichés à part, avec une explication. */
const GENERIC_HASHTAGS = new Set([
  'fyp', 'foryou', 'foryoupage', 'fypシ', 'fypシ゚viral', 'fy', 'fypage', 'pourtoi', 'pourtoii', 'pt', 'viral',
  'viralvideo', 'trend', 'trending', 'tendance', 'tiktok', 'tiktokfrance', 'tiktokfr', 'xyzbca', 'explore',
  'capcut', 'parati', 'foru', 'blowthisup', 'goviral', 'fypp', 'fyppppppppppppppppppppppp',
]);

const SOUNDS_TO_TRACK = 25;

export interface TrendVideo {
  id: string;
  author: string;
  authorName: string;
  views: number;
  likes: number;
  description: string;
  cover: string | null;
  url: string;
  market: Market;
  niches: string[];
  soundId: string | null;
  soundTitle: string | null;
  hashtags: string[];
  createdAt: number;
}

export type SoundStatus = 'exploding' | 'rising' | 'new' | 'stable';
/** Fenêtre de tir : où en est la tendance dans sa vie. */
export type TrendStage = 'emerging' | 'peak' | 'declining';

export interface TrendHashtag {
  tag: string;
  videos: number;       // vidéos tendance de la semaine qui l'utilisent
  totalViews: number;
  markets: Market[];
  niches: string[];
  generic: boolean;     // hashtag « fourre-tout » (#fyp, #pourtoi…)
}

export interface TrendSound {
  id: string;
  title: string;
  artist: string;
  cover: string | null;
  url: string;
  usageCount: number | null;     // nombre total de vidéos TikTok qui utilisent ce son
  previousUsageCount: number | null;
  growthPct: number | null;      // croissance depuis la collecte précédente
  status: SoundStatus;
  stage: TrendStage;
  appearances: number;           // nombre de vidéos tendance de la semaine qui l'utilisent
  totalViews: number;
  markets: Market[];
  notYetInFrance: boolean;       // présent aux US, pas (encore) en France
  niches: string[];
  topVideo: TrendVideo | null;
}

export interface TrendsSnapshot {
  weekId: string;
  collectedAt: string;
  creditsUsed: number;
  sounds: TrendSound[];
  videos: TrendVideo[];
  formats: TrendVideo[]; // vidéos à "son original" très vues : formats qui cartonnent
  hashtags: TrendHashtag[];
}

const isOriginalSound = (title = '') =>
  /^(original sound|son original|sonido original|som original|suono originale|originalton|оригинальный звук)/i.test(title.trim());

const weekIdOf = (d: Date) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

/** #fyp, #fypppp, #foryoupage2026, #capcutpioneer… : utiles pour la portée, pas pour cibler. */
const isGenericTag = (tag: string) =>
  GENERIC_HASHTAGS.has(tag) ||
  /(.)\1{3,}/.test(tag) ||
  /^(fyp|fvp|foryou|pourtoi|viral|trend|capcut|tiktok|xyz|explore)/.test(tag);

const extractHashtags = (text: string) =>
  [...new Set([...text.matchAll(/#([\p{L}\p{N}_]{2,40})/gu)].map((m) => m[1].toLowerCase()))].slice(0, 15);

const stageOf = (growth: number | null, usage: number | null): TrendStage => {
  if (growth != null) return growth >= 60 ? 'emerging' : growth >= 10 ? 'peak' : 'declining';
  // Première semaine (pas encore d'historique) : on estime avec le nombre total de vidéos
  if (usage != null && usage < 100_000) return 'emerging';
  return 'peak';
};

const toVideo = (v: any, market: Market, niche: string): TrendVideo => {
  const author = v.author?.unique_id ?? '';
  const music = v.music ?? {};
  return {
    id: String(v.aweme_id),
    author,
    authorName: v.author?.nickname ?? author,
    views: Number(v.statistics?.play_count ?? 0),
    likes: Number(v.statistics?.digg_count ?? 0),
    description: String(v.desc ?? '').slice(0, 160),
    cover: v.video?.cover?.url_list?.[0] ?? v.video?.origin_cover?.url_list?.[0] ?? null,
    url: author ? `https://www.tiktok.com/@${author}/video/${v.aweme_id}` : `https://www.tiktok.com/video/${v.aweme_id}`,
    market,
    niches: [niche],
    soundId: music.id_str ?? (music.id != null ? String(music.id) : null),
    soundTitle: music.title ?? null,
    hashtags: extractHashtags(String(v.desc ?? '')),
    createdAt: Number(v.create_time ?? 0),
  };
};

/** Regroupe les hashtags des vidéos tendance (au moins 2 vidéos pour compter). */
const aggregateHashtags = (all: TrendVideo[]): TrendHashtag[] => {
  const tags = new Map<string, { videos: number; views: number; markets: Set<Market>; niches: Set<string> }>();
  for (const v of all) {
    for (const tag of v.hashtags ?? extractHashtags(v.description)) {
      const t = tags.get(tag) ?? { videos: 0, views: 0, markets: new Set<Market>(), niches: new Set<string>() };
      t.videos++;
      t.views += v.views;
      t.markets.add(v.market);
      v.niches.forEach((n) => t.niches.add(n));
      tags.set(tag, t);
    }
  }
  return [...tags.entries()]
    .filter(([, t]) => t.videos >= 2)
    .map(([tag, t]) => ({
      tag, videos: t.videos, totalViews: t.views, markets: [...t.markets], niches: [...t.niches],
      generic: isGenericTag(tag),
    }))
    .sort((a, b) => b.videos - a.videos || b.totalViews - a.totalViews)
    .slice(0, 120);
};

// ---------- Stockage : Firestore si configuré, sinon fichier local (développement) ----------

const LOCAL_FILE = path.resolve(process.cwd(), 'data', 'trends-latest.json');

export const loadLatestTrends = async (): Promise<TrendsSnapshot | null> => {
  try {
    if (db) {
      const doc = await db.collection('trends').doc('latest').get();
      return doc.exists ? (doc.data() as TrendsSnapshot) : null;
    }
    if (fs.existsSync(LOCAL_FILE)) return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
  } catch (e) {
    console.error('❌ Lecture des tendances impossible:', e);
  }
  return null;
};

const saveTrends = async (snapshot: TrendsSnapshot) => {
  if (db) {
    await db.collection('trends').doc('latest').set(snapshot);
    await db.collection('trends').doc(snapshot.weekId).set(snapshot);
    return;
  }
  fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(snapshot, null, 2));
};

// ---------- Images ----------
// Les liens d'images de TikTok expirent au bout de quelques heures : on copie les miniatures
// au moment de la collecte et le serveur les sert lui-même (GET /api/trends/cover/:key).

const COVER_DIR = path.resolve(process.cwd(), 'data', 'covers');

const coverKey = (kind: string, id: string) => `${kind}_${id}`.replace(/[^a-zA-Z0-9_-]/g, '');

const storeCover = async (key: string, url: string | null): Promise<string | null> => {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 700_000) return null; // une miniature ne doit pas peser plus
    if (db) {
      await db.collection('trendCovers').doc(key).set({ type, data: buf.toString('base64'), at: new Date().toISOString() });
    } else {
      fs.mkdirSync(COVER_DIR, { recursive: true });
      fs.writeFileSync(path.join(COVER_DIR, `${key}.bin`), buf);
      fs.writeFileSync(path.join(COVER_DIR, `${key}.type`), type);
    }
    return `/api/trends/cover/${key}`;
  } catch {
    return null;
  }
};

export const loadCover = async (key: string): Promise<{ type: string; data: Buffer } | null> => {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '');
  if (db) {
    const doc = await db.collection('trendCovers').doc(safe).get();
    if (!doc.exists) return null;
    const d = doc.data() as { type: string; data: string };
    return { type: d.type, data: Buffer.from(d.data, 'base64') };
  }
  const file = path.join(COVER_DIR, `${safe}.bin`);
  if (!fs.existsSync(file)) return null;
  return { type: fs.readFileSync(path.join(COVER_DIR, `${safe}.type`), 'utf8'), data: fs.readFileSync(file) };
};

/** Supprime les miniatures de plus de 3 semaines (elles ne sont plus affichées). */
const cleanupOldCovers = async () => {
  const cutoff = new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString();
  try {
    if (db) {
      const old = await db.collection('trendCovers').where('at', '<', cutoff).limit(400).get();
      const batch = db.batch();
      old.forEach((d) => batch.delete(d.ref));
      if (!old.empty) await batch.commit();
    } else if (fs.existsSync(COVER_DIR)) {
      for (const f of fs.readdirSync(COVER_DIR)) {
        const file = path.join(COVER_DIR, f);
        if (fs.statSync(file).mtime.toISOString() < cutoff) fs.unlinkSync(file);
      }
    }
  } catch (e) {
    console.warn('⚠️ Nettoyage des miniatures impossible:', e);
  }
};

/** Copie les miniatures (par paquets de 6) et remplace les liens temporaires. */
const persistCovers = async (snap: TrendsSnapshot) => {
  const jobs: (() => Promise<void>)[] = [];
  const videoJob = (v: TrendVideo | null) => {
    if (!v || !v.cover || v.cover.startsWith('/api/')) return;
    jobs.push(async () => {
      if (v.cover && !v.cover.startsWith('/api/')) v.cover = await storeCover(coverKey('v', v.id), v.cover);
    });
  };
  for (const s of snap.sounds) {
    if (s.cover && !s.cover.startsWith('/api/')) {
      jobs.push(async () => { s.cover = await storeCover(coverKey('s', s.id), s.cover); });
    }
    videoJob(s.topVideo);
  }
  snap.videos.forEach(videoJob);
  snap.formats.forEach(videoJob);
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map((j) => j()));
  // Un lien TikTok non copié expirera : mieux vaut aucune image qu'une image cassée
  [...snap.videos, ...snap.formats, ...snap.sounds.map((s) => s.topVideo)].forEach((v) => {
    if (v && v.cover && !v.cover.startsWith('/api/')) v.cover = null;
  });
  snap.sounds.forEach((s) => { if (s.cover && !s.cover.startsWith('/api/')) s.cover = null; });
};

// ---------- Collecte ----------

let collecting = false;

export const collectTrends = async (): Promise<TrendsSnapshot> => {
  if (collecting) throw new Error('Une collecte est déjà en cours');
  collecting = true;
  const started = Date.now();
  let credits = 0;
  try {
    const previous = await loadLatestTrends();
    const previousUsage = new Map((previous?.sounds ?? []).map((s) => [s.id, s.usageCount]));
    const seenInFranceBefore = new Set(
      (previous?.sounds ?? []).filter((s) => s.markets.includes('FR')).map((s) => s.id)
    );

    // 1. Vidéos de la semaine, par niche et par marché
    const videos = new Map<string, TrendVideo>();
    // Infos des sons déjà présentes dans les résultats de recherche (évite des requêtes en plus)
    const soundMeta = new Map<string, { usage: number | null; cover: string | null; artist: string }>();
    for (const [niche, queries] of Object.entries(QUERIES)) {
      for (const [market, query] of queries) {
        credits++;
        const json = await sociavault('/search/keyword', {
          query,
          region: market,
          date_posted: 'this-week',
          sort_by: 'most-liked',
        });
        for (const raw of extractVideos(json)) {
          if (Number(raw.statistics?.play_count ?? 0) < MIN_VIDEO_VIEWS) continue;
          const v = toVideo(raw, market, niche);
          const m = raw.music ?? {};
          if (v.soundId) {
            const prevMeta = soundMeta.get(v.soundId);
            const known = [m.user_count, prevMeta?.usage].filter((x) => x != null).map(Number);
            soundMeta.set(v.soundId, {
              usage: known.length ? Math.max(...known) : null,
              cover: prevMeta?.cover ?? m.cover_large?.url_list?.[0] ?? m.cover_medium?.url_list?.[0] ?? null,
              artist: prevMeta?.artist || m.author || m.owner_nickname || '',
            });
          }
          const existing = videos.get(v.id);
          if (existing) {
            if (!existing.niches.includes(niche)) existing.niches.push(niche);
          } else {
            videos.set(v.id, v);
          }
        }
      }
    }

    // 2. Regroupement par son
    type Acc = { id: string; title: string; artist: string; cover: string | null; videos: TrendVideo[]; markets: Set<Market>; niches: Set<string> };
    const bySound = new Map<string, Acc>();
    for (const v of videos.values()) {
      if (!v.soundId || !v.soundTitle || isOriginalSound(v.soundTitle)) continue;
      const acc = bySound.get(v.soundId) ?? {
        id: v.soundId, title: v.soundTitle, artist: '', cover: null,
        videos: [], markets: new Set<Market>(), niches: new Set<string>(),
      };
      acc.videos.push(v);
      acc.markets.add(v.market);
      v.niches.forEach((n) => acc.niches.add(n));
      bySound.set(v.soundId, acc);
    }

    const candidates = [...bySound.values()]
      .map((a) => ({ ...a, views: a.videos.reduce((s, v) => s + v.views, 0) }))
      .filter((a) => a.views >= MIN_SOUND_VIEWS)
      .sort((a, b) => b.videos.length - a.videos.length || b.views - a.views)
      .slice(0, SOUNDS_TO_TRACK);

    // 3. Sons suivis : nombre total de vidéos (déjà dans la recherche, sinon 1 requête), croissance
    const sounds: TrendSound[] = [];
    for (const c of candidates) {
      const meta = soundMeta.get(c.id);
      let info: any = { title: c.title, author: meta?.artist, user_count: meta?.usage, cover_large: meta?.cover ? { url_list: [meta.cover] } : undefined };
      if (meta?.usage == null) {
        credits++;
        const details = await sociavault('/music/details', { clipId: c.id });
        info = details?.music_info ?? details?.data?.music_info ?? info;
      }
      const usage = info.user_count != null ? Number(info.user_count) : null;
      const prev = previousUsage.get(c.id) ?? null;
      const growth = usage != null && prev ? Math.round(((usage - prev) / prev) * 100) : null;
      const status: SoundStatus =
        prev == null ? 'new' : growth != null && growth >= 100 ? 'exploding' : growth != null && growth >= 25 ? 'rising' : 'stable';
      const topVideo = [...c.videos].sort((a, b) => b.views - a.views)[0] ?? null;
      const markets = [...c.markets];
      sounds.push({
        id: c.id,
        title: info.title ?? c.title,
        artist: info.author ?? '',
        cover: info.cover_large?.url_list?.[0] ?? info.cover_medium?.url_list?.[0] ?? topVideo?.cover ?? null,
        url: `https://www.tiktok.com/music/${encodeURIComponent((info.title ?? c.title).replace(/\s+/g, '-'))}-${c.id}`,
        usageCount: usage,
        previousUsageCount: prev,
        growthPct: growth,
        status,
        stage: stageOf(growth, usage),
        appearances: c.videos.length,
        totalViews: c.views,
        markets,
        notYetInFrance: markets.includes('US') && !markets.includes('FR') && !seenInFranceBefore.has(c.id),
        niches: [...c.niches],
        topVideo,
      });
    }

    // Ordre final : sons qui explosent d'abord, puis présence et vues
    const statusWeight: Record<SoundStatus, number> = { exploding: 3, rising: 2, new: 1, stable: 0 };
    sounds.sort(
      (a, b) =>
        statusWeight[b.status] - statusWeight[a.status] ||
        b.appearances - a.appearances ||
        (b.growthPct ?? 0) - (a.growthPct ?? 0) ||
        b.totalViews - a.totalViews
    );

    const all = [...videos.values()].sort((a, b) => b.views - a.views);

    // 4. Hashtags qui reviennent dans les vidéos tendance
    const hashtags = aggregateHashtags(all);

    const snapshot: TrendsSnapshot = {
      weekId: weekIdOf(new Date()),
      collectedAt: new Date().toISOString(),
      creditsUsed: credits,
      sounds,
      videos: all.filter((v) => v.soundTitle && !isOriginalSound(v.soundTitle)).slice(0, 80),
      formats: all.filter((v) => !v.soundTitle || isOriginalSound(v.soundTitle)).slice(0, 60),
      hashtags,
    };
    await persistCovers(snapshot);
    await saveTrends(snapshot);
    await cleanupOldCovers();
    console.log(
      `📈 Tendances collectées (${snapshot.weekId}) : ${videos.size} vidéos, ${sounds.length} sons, ${credits} crédits, ${Math.round((Date.now() - started) / 1000)} s`
    );
    return snapshot;
  } finally {
    collecting = false;
  }
};

/**
 * Vue adaptée à une niche : son contenu propre d'abord, puis les tendances générales
 * seulement pour compléter (sinon toutes les niches finiraient par se ressembler).
 */
const pick = <T extends { niches: string[] }>(items: T[], niche: string | undefined, min: number, max: number): T[] => {
  if (!niche || niche === 'all') return items.slice(0, max);
  const own = items.filter((i) => i.niches.includes(niche));
  if (own.length >= min) return own.slice(0, max);
  const filler = items.filter((i) => !i.niches.includes(niche) && i.niches.includes('general'));
  return [...own, ...filler].slice(0, Math.max(min, own.length));
};

export const trendsForNiche = (snap: TrendsSnapshot, niche?: string) => {
  // Compatibilité avec une collecte plus ancienne (sans étape de vie ni hashtags)
  snap.sounds.forEach((s) => { if (!s.stage) s.stage = stageOf(s.growthPct, s.usageCount); });
  if (!snap.hashtags) snap.hashtags = aggregateHashtags([...snap.videos, ...snap.formats]);
  const sounds = pick(snap.sounds, niche, 6, 20);
  const allTags = snap.hashtags;
  const specific = allTags.filter((h) => !h.generic);
  return {
    weekId: snap.weekId,
    collectedAt: snap.collectedAt,
    sounds,
    notYetInFrance: pick(snap.sounds.filter((s) => s.notYetInFrance), niche, 3, 10),
    videos: pick(snap.videos, niche, 8, 15),
    formats: pick(snap.formats, niche, 6, 12),
    hashtags: pick(specific, niche, 8, 15),
    genericHashtags: allTags.filter((h) => h.generic).slice(0, 4),
  };
};

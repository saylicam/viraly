import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';
import { sociavault, extractVideos } from './sociavault';

/**
 * Bilan d'un compte TikTok à partir du @pseudo (données publiques via SociaVault).
 * - Les chiffres (moyennes, horaires, régularité, score) sont CALCULÉS ici : fiables et identiques d'une fois à l'autre.
 * - Gemini interprète (niche réelle, style, ce qui marche, plan d'action) et rédige la « fiche créateur »
 *   qui sert ensuite à personnaliser toutes les autres fonctions IA de l'app.
 * Coût : 3 crédits SociaVault par bilan (profil + vidéos récentes + vidéos populaires), mis en cache 24 h.
 */

// ---------- Types ----------

export interface AccountProfile {
  handle: string;
  nickname: string;
  avatar: string | null;
  bio: string;
  verified: boolean;
  followers: number;
  following: number;
  likes: number;
  videoCount: number;
}

export interface AccountVideo {
  id: string;
  url: string;
  description: string;
  createdAt: number; // secondes
  duration: number; // secondes
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement: number; // %
  cover: string | null;
  pinned: boolean;
}

export interface AccountStats {
  analysedVideos: number;
  avgViews: number;
  medianViews: number;
  avgLikes: number;
  engagementRate: number; // %
  engagementBenchmark: number; // % attendu pour un compte de cette taille
  viewsPerFollower: number; // vues médianes / abonnés
  postsPerWeek: number; // sur les 30 derniers jours
  daysSinceLastPost: number | null;
  avgDuration: number;
  hitRate: number; // % de vidéos à plus de 2x la médiane
  momentum: number; // % d'évolution des vues : 5 dernières vs 5 précédentes
  bestDays: { day: string; medianViews: number; posts: number }[];
  bestHours: { slot: string; medianViews: number; posts: number }[];
  weekdayChart: { day: string; value: number }[];
  viewsSeries: { id: string; views: number; createdAt: number }[];
  durationInsight: { short: number | null; long: number | null }; // vues médianes < 20 s / ≥ 20 s
}

export interface AccountScore {
  total: number;
  parts: { key: 'engagement' | 'regularite' | 'portee' | 'dynamique'; label: string; value: number }[];
}

export interface CreatorCard {
  handle: string;
  niche: string;
  style: string;
  ton: string;
  public: string;
  formats_gagnants: string[];
  accroches_qui_marchent: string[];
  forces: string[];
  faiblesses: string[];
  a_eviter: string[];
  moyenne_vues: number;
  engagement: number;
  abonnes: number;
  duree_ideale: string;
  meilleurs_creneaux: string[];
  updatedAt: string;
}

export interface AccountInsights {
  titre: string;
  resume: string;
  niveau: string;
  niche_detectee: string;
  style: string;
  ton: string;
  public: string;
  points_forts: { titre: string; detail: string }[];
  points_faibles: { titre: string; detail: string; solution: string }[];
  formats_gagnants: { titre: string; pourquoi: string; video_id: string }[];
  meilleure_video: { id: string; pourquoi: string };
  video_a_retravailler: { id: string; pourquoi: string; comment: string };
  conseil_principal: { titre: string; action: string };
  plan_semaine: { jour: string; idee: string; format: string; accroche: string }[];
  objectif_30_jours: string;
  accroches_qui_marchent: string[];
  a_eviter: string[];
  duree_ideale: string;
}

export interface AccountAudit {
  version: 1;
  handle: string;
  generatedAt: string;
  profile: AccountProfile;
  stats: AccountStats;
  score: AccountScore;
  videos: AccountVideo[]; // triées par date, les plus récentes d'abord
  topVideos: AccountVideo[]; // 3 meilleures en vues
  insights: AccountInsights;
  card: CreatorCard;
}

// ---------- Pseudo ----------

/** « @Nom.Compte », « tiktok.com/@nom » ou « nom » → « nom.compte ». Null si invalide. */
export const normalizeHandle = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  let h = raw.trim();
  const fromUrl = h.match(/tiktok\.com\/@([^/?#\s]+)/i);
  if (fromUrl) h = fromUrl[1];
  h = h.replace(/^@+/, '').toLowerCase();
  return /^[a-z0-9._]{2,24}$/.test(h) ? h : null;
};

// ---------- Collecte ----------

const num = (v: any) => {
  const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export class AccountError extends Error {
  constructor(public code: 'NOT_FOUND' | 'PRIVATE' | 'NO_VIDEOS' | 'UNAVAILABLE', message: string) {
    super(message);
  }
}

export const fetchProfile = async (handle: string): Promise<AccountProfile & { userId?: string }> => {
  const json = await sociavault('/profile', { handle });
  const data = json?.data ?? json;
  const user = data?.user ?? data?.userInfo?.user;
  if (!user?.uniqueId) {
    if (json === null) throw new AccountError('UNAVAILABLE', 'Le service TikTok ne répond pas pour le moment.');
    throw new AccountError('NOT_FOUND', `Aucun compte TikTok @${handle} trouvé.`);
  }
  const stats = data?.statsV2 ?? data?.stats ?? data?.userInfo?.stats ?? {};
  return {
    userId: user.id,
    handle: String(user.uniqueId).toLowerCase(),
    nickname: user.nickname || user.uniqueId,
    avatar: user.avatarLarger || user.avatarMedium || user.avatarThumb || null,
    bio: (user.signature || '').slice(0, 200),
    verified: !!user.verified,
    followers: num(stats.followerCount),
    following: num(stats.followingCount),
    likes: num(stats.heartCount ?? stats.heart),
    videoCount: num(stats.videoCount),
    ...(user.privateAccount || user.secret ? { private: true } : {}),
  } as any;
};

const toVideo = (v: any, handle: string): AccountVideo => {
  const s = v.statistics ?? {};
  const views = num(s.play_count);
  const likes = num(s.digg_count);
  const comments = num(s.comment_count);
  const shares = num(s.share_count);
  const saves = num(s.collect_count);
  const dur = num(v.video?.duration ?? v.duration);
  return {
    id: String(v.aweme_id),
    url: `https://www.tiktok.com/@${handle}/video/${v.aweme_id}`,
    description: String(v.desc ?? '').slice(0, 220),
    createdAt: num(v.create_time),
    duration: dur > 1000 ? Math.round(dur / 1000) : dur,
    views, likes, comments, shares, saves,
    engagement: views ? Math.round(((likes + comments + shares + saves) / views) * 1000) / 10 : 0,
    cover: v.video?.cover?.url_list?.[0] ?? v.video?.origin_cover?.url_list?.[0] ?? v.video?.dynamic_cover?.url_list?.[0] ?? null,
    pinned: !!v.is_top,
  };
};

const fetchVideos = async (handle: string, userId?: string) => {
  const base: Record<string, string> = { handle, trim: 'true' };
  if (userId) base.user_id = userId;
  const [latest, popular] = await Promise.all([
    sociavault('/videos', { ...base, sort_by: 'latest' }),
    sociavault('/videos', { ...base, sort_by: 'popular' }),
  ]);
  const map = new Map<string, AccountVideo>();
  for (const raw of [...extractVideos(latest), ...extractVideos(popular)]) {
    if (raw?.is_ad) continue;
    const v = toVideo(raw, handle);
    if (!map.has(v.id)) map.set(v.id, v);
  }
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
};

// ---------- Calculs ----------

const median = (arr: number[]) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, Math.round(n)));

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const SLOTS = [
  { label: 'Matin (6 h – 11 h)', from: 6, to: 11 },
  { label: 'Midi (11 h – 14 h)', from: 11, to: 14 },
  { label: 'Après-midi (14 h – 18 h)', from: 14, to: 18 },
  { label: 'Soirée (18 h – 22 h)', from: 18, to: 22 },
  { label: 'Nuit (22 h – 6 h)', from: 22, to: 30 },
];

/** Heure et jour à Paris/Bruxelles. */
const parisParts = (sec: number) => {
  const d = new Date(sec * 1000);
  const fmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', hour: 'numeric', hour12: false });
  const parts = fmt.formatToParts(d);
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = num(parts.find((p) => p.type === 'hour')?.value);
  const dayIdx = DAYS.findIndex((x) => x.toLowerCase() === wd.toLowerCase());
  return { day: dayIdx >= 0 ? dayIdx : d.getUTCDay(), hour };
};

/** Engagement « normal » sur TikTok selon la taille du compte (ordre de grandeur du marché). */
const benchmarkFor = (followers: number) =>
  followers < 10_000 ? 8 : followers < 100_000 ? 6.5 : followers < 1_000_000 ? 5 : 4;

export const computeStats = (profile: AccountProfile, all: AccountVideo[]): AccountStats => {
  // Les vidéos épinglées faussent les moyennes récentes : on les garde pour le classement seulement
  const vids = all.filter((v) => !v.pinned).slice(0, 40);
  const pool = vids.length >= 3 ? vids : all;
  const views = pool.map((v) => v.views);
  const med = median(views);
  const totalViews = views.reduce((a, b) => a + b, 0);
  const totalEng = pool.reduce((a, v) => a + v.likes + v.comments + v.shares + v.saves, 0);
  const nowSec = Date.now() / 1000;
  const last30 = pool.filter((v) => nowSec - v.createdAt < 30 * 86400).length;
  const newest = pool[0]?.createdAt;

  const byDay = new Map<number, number[]>();
  const bySlot = new Map<number, number[]>();
  pool.forEach((v) => {
    const { day, hour } = parisParts(v.createdAt);
    byDay.set(day, [...(byDay.get(day) ?? []), v.views]);
    const h = hour < 6 ? hour + 24 : hour;
    const si = SLOTS.findIndex((s) => h >= s.from && h < s.to);
    if (si >= 0) bySlot.set(si, [...(bySlot.get(si) ?? []), v.views]);
  });
  const rank = <K>(m: Map<K, number[]>, label: (k: K) => string) =>
    [...m.entries()]
      .map(([k, arr]) => ({ key: label(k), medianViews: median(arr), posts: arr.length }))
      .sort((a, b) => (b.posts >= 2 ? 1 : 0) - (a.posts >= 2 ? 1 : 0) || b.medianViews - a.medianViews);

  const bestDays = rank(byDay, (k) => DAYS[k as number]).slice(0, 3).map((x) => ({ day: x.key, medianViews: x.medianViews, posts: x.posts }));
  const bestHours = rank(bySlot, (k) => SLOTS[k as number].label).slice(0, 3).map((x) => ({ slot: x.key, medianViews: x.medianViews, posts: x.posts }));
  const weekOrder = [1, 2, 3, 4, 5, 6, 0];
  const weekdayChart = weekOrder.map((d) => ({ day: DAYS[d].slice(0, 3), value: median(byDay.get(d) ?? []) }));

  const recent = pool.slice(0, 5).map((v) => v.views);
  const before = pool.slice(5, 10).map((v) => v.views);
  const momentum = before.length >= 3 && median(before) > 0 ? Math.round(((median(recent) - median(before)) / median(before)) * 100) : 0;

  const shorts = pool.filter((v) => v.duration > 0 && v.duration < 20).map((v) => v.views);
  const longs = pool.filter((v) => v.duration >= 20).map((v) => v.views);

  return {
    analysedVideos: pool.length,
    avgViews: pool.length ? Math.round(totalViews / pool.length) : 0,
    medianViews: med,
    avgLikes: pool.length ? Math.round(pool.reduce((a, v) => a + v.likes, 0) / pool.length) : 0,
    engagementRate: totalViews ? Math.round((totalEng / totalViews) * 1000) / 10 : 0,
    engagementBenchmark: benchmarkFor(profile.followers),
    viewsPerFollower: profile.followers ? Math.round((med / profile.followers) * 100) / 100 : 0,
    postsPerWeek: Math.round((last30 / 30) * 7 * 10) / 10,
    daysSinceLastPost: newest ? Math.floor((nowSec - newest) / 86400) : null,
    avgDuration: pool.length ? Math.round(pool.reduce((a, v) => a + v.duration, 0) / pool.length) : 0,
    hitRate: pool.length ? Math.round((pool.filter((v) => v.views > med * 2).length / pool.length) * 100) : 0,
    momentum,
    bestDays,
    bestHours,
    weekdayChart,
    viewsSeries: pool.slice(0, 20).reverse().map((v) => ({ id: v.id, views: v.views, createdAt: v.createdAt })),
    durationInsight: { short: shorts.length >= 2 ? median(shorts) : null, long: longs.length >= 2 ? median(longs) : null },
  };
};

/** Score Viraly du compte (0-100), calculé et non « inventé » par l'IA. */
export const computeScore = (s: AccountStats): AccountScore => {
  const engagement = clamp((s.engagementRate / s.engagementBenchmark) * 70);
  const regularite = clamp(
    (Math.min(s.postsPerWeek, 5) / 5) * 85 + (s.daysSinceLastPost !== null && s.daysSinceLastPost <= 3 ? 15 : s.daysSinceLastPost !== null && s.daysSinceLastPost <= 7 ? 8 : 0)
  );
  // Portée : vues médianes rapportées aux abonnés (0,3 = bien, 1 = excellent) + régularité des succès
  const portee = clamp(Math.min(s.viewsPerFollower, 1.2) * 70 + Math.min(s.hitRate, 30) + (s.medianViews > 1000 ? 5 : 0));
  const dynamique = clamp(55 + Math.max(-55, Math.min(45, s.momentum / 2)));
  const total = clamp(engagement * 0.3 + regularite * 0.25 + portee * 0.3 + dynamique * 0.15);
  return {
    total,
    parts: [
      { key: 'engagement', label: 'Engagement', value: engagement },
      { key: 'regularite', label: 'Régularité', value: regularite },
      { key: 'portee', label: 'Portée', value: portee },
      { key: 'dynamique', label: 'Dynamique', value: dynamique },
    ],
  };
};

// ---------- IA ----------

const NICHES: Record<string, string> = {
  comedy: 'comédie / sketchs', music: 'musique', beauty: 'beauté / maquillage', education: 'éducation / astuces',
  gaming: 'gaming', fitness: 'fitness / sport', tech: 'tech', food: 'cuisine', travel: 'voyage', lifestyle: 'lifestyle',
};
const GOALS: Record<string, string> = {
  views: 'faire plus de vues', engagement: 'plus d’engagement', fanbase: 'construire une communauté fidèle', monetization: 'monétiser son contenu',
};

let model: any = null;
const getModel = () => {
  if (!model) {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY as string);
    model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      generationConfig: { responseMimeType: 'application/json', temperature: 0.5, maxOutputTokens: 6144 },
    });
  }
  return model;
};

const fmt = (n: number) => n.toLocaleString('fr-FR');

const buildPrompt = (p: AccountProfile, s: AccountStats, videos: AccountVideo[], ctx: { niche?: string; goal?: string }) => {
  const list = videos.slice(0, 30).map((v) => {
    const d = new Date(v.createdAt * 1000).toISOString().slice(0, 10);
    return `- [${v.id}] ${d} · ${v.duration}s · ${fmt(v.views)} vues · ${fmt(v.likes)} likes · ${v.comments} com. · ${v.shares} partages · ${v.saves} enreg. · eng. ${v.engagement}%${v.pinned ? ' · ÉPINGLÉE' : ''}\n  « ${v.description || '(sans légende)'} »`;
  }).join('\n');

  return `Tu es le coach TikTok de Viraly. Tu fais le BILAN COMPLET d'un compte TikTok à partir de ses vraies données publiques.
Le créateur doit se dire : « c'est exactement moi, et je sais enfin quoi faire ». Sois précis, chiffré, honnête et motivant.
Français naturel, tutoiement, phrases courtes, aucun jargon. Appuie chaque constat sur les chiffres ou des vidéos précises.

LE COMPTE @${p.handle} (${p.nickname})
- Bio : « ${p.bio || '—'} »
- ${fmt(p.followers)} abonnés · ${fmt(p.likes)} likes au total · ${fmt(p.videoCount)} vidéos publiées
${ctx.niche ? `- Niche déclarée par le créateur : ${NICHES[ctx.niche] ?? ctx.niche}` : ''}
${ctx.goal ? `- Objectif déclaré : ${GOALS[ctx.goal] ?? ctx.goal}` : ''}

CHIFFRES CALCULÉS (sur ${s.analysedVideos} vidéos récentes, hors épinglées)
- Vues : moyenne ${fmt(s.avgViews)}, médiane ${fmt(s.medianViews)} (= ${s.viewsPerFollower} × le nombre d'abonnés)
- Engagement : ${s.engagementRate}% (normal pour cette taille de compte : ~${s.engagementBenchmark}%)
- Publication : ${s.postsPerWeek} vidéo(s)/semaine sur 30 jours, dernière il y a ${s.daysSinceLastPost ?? '?'} jour(s)
- Durée moyenne : ${s.avgDuration} s${s.durationInsight.short !== null && s.durationInsight.long !== null ? ` (médiane < 20 s : ${fmt(s.durationInsight.short)} vues ; ≥ 20 s : ${fmt(s.durationInsight.long)} vues)` : ''}
- ${s.hitRate}% des vidéos font plus de 2× la médiane · évolution récente des vues : ${s.momentum > 0 ? '+' : ''}${s.momentum}%
- Meilleurs jours : ${s.bestDays.map((d) => `${d.day} (${fmt(d.medianViews)} vues méd., ${d.posts} vidéos)`).join(', ') || '—'}
- Meilleurs créneaux (heure de Paris) : ${s.bestHours.map((h) => `${h.slot} (${fmt(h.medianViews)}, ${h.posts} vidéos)`).join(', ') || '—'}

SES VIDÉOS ([id] date · durée · stats · légende)
${list}

À FAIRE
1. Déduis sa VRAIE niche, son style de vidéo (face caméra, voix off, sketch, tuto, vlog, montage, trend…), son ton et son public probable,
   à partir des légendes et de ce qui performe (pas seulement de la niche déclarée). Sois précis : « sketchs sur la vie en famille »
   plutôt que « humour ».
2. Compare ses meilleures et ses moins bonnes vidéos : qu'est-ce qui les différencie (sujet, format, durée, légende, accroche, jour) ?
3. Donne des conseils actionnables pour CE compte (jamais génériques), en t'appuyant sur ses chiffres.
4. Si peu de vidéos ou peu de données, dis-le simplement et donne quand même un plan de départ.
Les "video_id" doivent être des id de la liste ci-dessus.

Réponds UNIQUEMENT en JSON :
{
  "titre": "phrase-titre du bilan, percutante et personnelle (max 9 mots), ex. « Ton humour marche, ta régularité te freine »",
  "resume": "2-3 phrases : où en est le compte, ce qui marche, ce qui bloque",
  "niveau": "Débutant | En progression | Établi | Confirmé",
  "niche_detectee": "niche précise en 2-5 mots",
  "style": "style de vidéos en 3-8 mots",
  "ton": "ton en 2-4 mots",
  "public": "public probable en 1 phrase",
  "points_forts": [{ "titre": "2-5 mots", "detail": "1 phrase chiffrée ou avec exemple" }],
  "points_faibles": [{ "titre": "2-5 mots", "detail": "1 phrase chiffrée", "solution": "quoi faire concrètement, 1-2 phrases" }],
  "formats_gagnants": [{ "titre": "nom du format (2-5 mots)", "pourquoi": "pourquoi ça marche chez lui (chiffres)", "video_id": "id" }],
  "meilleure_video": { "id": "id", "pourquoi": "pourquoi elle a marché, 1-2 phrases" },
  "video_a_retravailler": { "id": "id", "pourquoi": "pourquoi elle a moins marché", "comment": "comment la refaire mieux" },
  "conseil_principal": { "titre": "LA priorité en max 7 mots", "action": "ce qu'il doit faire dès cette semaine, 1-2 phrases" },
  "plan_semaine": [{ "jour": "Lundi", "idee": "idée de vidéo précise pour son compte", "format": "format", "accroche": "texte d'accroche à l'écran" }],
  "objectif_30_jours": "objectif réaliste et chiffré pour les 30 prochains jours",
  "accroches_qui_marchent": ["2-4 types d'accroches ou de sujets qui marchent chez lui"],
  "a_eviter": ["2-3 choses qui font baisser ses vues"],
  "duree_ideale": "ex. 12 à 20 secondes"
}
3 points forts, 3 points faibles, 2 à 3 formats gagnants, 3 à 4 jours dans plan_semaine (calés sur ses meilleurs jours).`;
};

const str = (v: any, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strArr = (v: any, n: number, max = 160) => (Array.isArray(v) ? v.map((x) => str(x, max)).filter(Boolean).slice(0, n) : []);

const normalizeInsights = (raw: any, videos: AccountVideo[]): AccountInsights => {
  const ids = new Set(videos.map((v) => v.id));
  const byViews = [...videos].sort((a, b) => b.views - a.views);
  const vid = (id: any, fallback?: AccountVideo) => (ids.has(String(id)) ? String(id) : fallback?.id ?? '');
  if (!raw || !str(raw.resume)) throw new Error('Bilan incomplet');
  return {
    titre: str(raw.titre, 90) || 'Ton bilan TikTok',
    resume: str(raw.resume, 600),
    niveau: str(raw.niveau, 30) || 'En progression',
    niche_detectee: str(raw.niche_detectee, 60),
    style: str(raw.style, 80),
    ton: str(raw.ton, 40),
    public: str(raw.public, 200),
    points_forts: (Array.isArray(raw.points_forts) ? raw.points_forts : []).slice(0, 4).map((x: any) => ({ titre: str(x?.titre, 50), detail: str(x?.detail) })).filter((x: any) => x.titre),
    points_faibles: (Array.isArray(raw.points_faibles) ? raw.points_faibles : []).slice(0, 4).map((x: any) => ({ titre: str(x?.titre, 50), detail: str(x?.detail), solution: str(x?.solution) })).filter((x: any) => x.titre),
    formats_gagnants: (Array.isArray(raw.formats_gagnants) ? raw.formats_gagnants : []).slice(0, 3).map((x: any) => ({ titre: str(x?.titre, 50), pourquoi: str(x?.pourquoi), video_id: vid(x?.video_id) })).filter((x: any) => x.titre),
    meilleure_video: { id: vid(raw.meilleure_video?.id, byViews[0]), pourquoi: str(raw.meilleure_video?.pourquoi) },
    video_a_retravailler: { id: vid(raw.video_a_retravailler?.id, byViews[byViews.length - 1]), pourquoi: str(raw.video_a_retravailler?.pourquoi), comment: str(raw.video_a_retravailler?.comment) },
    conseil_principal: { titre: str(raw.conseil_principal?.titre, 70) || 'Ta priorité', action: str(raw.conseil_principal?.action) },
    plan_semaine: (Array.isArray(raw.plan_semaine) ? raw.plan_semaine : []).slice(0, 5).map((x: any) => ({ jour: str(x?.jour, 12), idee: str(x?.idee, 200), format: str(x?.format, 60), accroche: str(x?.accroche, 80) })).filter((x: any) => x.idee),
    objectif_30_jours: str(raw.objectif_30_jours),
    accroches_qui_marchent: strArr(raw.accroches_qui_marchent, 4),
    a_eviter: strArr(raw.a_eviter, 3),
    duree_ideale: str(raw.duree_ideale, 40),
  };
};

const generateInsights = async (p: AccountProfile, s: AccountStats, videos: AccountVideo[], ctx: { niche?: string; goal?: string }) => {
  const prompt = buildPrompt(p, s, videos, ctx);
  let lastErr: any;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await getModel().generateContent(prompt);
      const text = result.response.text();
      return normalizeInsights(JSON.parse(text.replace(/^```json\s*|```$/g, '').trim()), videos);
    } catch (e) {
      lastErr = e;
      console.warn(`⚠️ Bilan compte (essai ${attempt}) :`, (e as any)?.message);
    }
  }
  throw lastErr;
};

const buildCard = (p: AccountProfile, s: AccountStats, i: AccountInsights): CreatorCard => ({
  handle: p.handle,
  niche: i.niche_detectee,
  style: i.style,
  ton: i.ton,
  public: i.public,
  formats_gagnants: i.formats_gagnants.map((f) => f.titre),
  accroches_qui_marchent: i.accroches_qui_marchent,
  forces: i.points_forts.map((f) => f.titre),
  faiblesses: i.points_faibles.map((f) => `${f.titre} : ${f.detail}`.slice(0, 160)),
  a_eviter: i.a_eviter,
  moyenne_vues: s.medianViews,
  engagement: s.engagementRate,
  abonnes: p.followers,
  duree_ideale: i.duree_ideale,
  meilleurs_creneaux: [...s.bestDays.slice(0, 2).map((d) => d.day), ...s.bestHours.slice(0, 1).map((h) => h.slot)],
  updatedAt: new Date().toISOString(),
});

// ---------- Point d'entrée ----------

const cache = new Map<string, { audit: AccountAudit; at: number }>();
const profileCache = new Map<string, { profile: AccountProfile; at: number }>();
const DAY = 24 * 3600 * 1000;

export const getCachedAudit = (handle: string) => {
  const hit = cache.get(handle);
  return hit && Date.now() - hit.at < DAY ? hit.audit : null;
};

/** Aperçu rapide (1 crédit) : avatar, nom, abonnés. Utilisé pendant l'inscription. */
export const previewAccount = async (handle: string): Promise<AccountProfile> => {
  const audit = getCachedAudit(handle);
  if (audit) return audit.profile;
  const hit = profileCache.get(handle);
  if (hit && Date.now() - hit.at < DAY) return hit.profile;
  const { userId, ...profile } = await fetchProfile(handle) as any;
  profileCache.set(handle, { profile, at: Date.now() });
  return profile;
};

export const auditAccount = async (handle: string, ctx: { niche?: string; goal?: string } = {}, force = false): Promise<AccountAudit> => {
  if (!force) {
    const hit = getCachedAudit(handle);
    if (hit) return hit;
  }
  const prof: any = await fetchProfile(handle);
  if (prof.private) throw new AccountError('PRIVATE', `Le compte @${handle} est privé : passe-le en public pour recevoir ton bilan.`);
  const { userId, private: _p, ...profile } = prof;
  const videos = await fetchVideos(profile.handle, userId);
  if (!videos.length) throw new AccountError('NO_VIDEOS', `On n'a trouvé aucune vidéo publique sur @${handle}. Publie ta première vidéo, puis reviens !`);

  const stats = computeStats(profile, videos);
  const score = computeScore(stats);
  const insights = await generateInsights(profile, stats, videos, ctx);
  const audit: AccountAudit = {
    version: 1,
    handle: profile.handle,
    generatedAt: new Date().toISOString(),
    profile,
    stats,
    score,
    videos: videos.slice(0, 30),
    topVideos: [...videos].sort((a, b) => b.views - a.views).slice(0, 3),
    insights,
    card: buildCard(profile, stats, insights),
  };
  cache.set(handle, { audit, at: Date.now() });
  profileCache.set(handle, { profile, at: Date.now() });
  return audit;
};

/**
 * Version gratuite du bilan : chiffres, score, profil du créateur, meilleure vidéo et 1 conseil.
 * Le détail (points faibles, formats gagnants, plan de la semaine…) est réservé à Premium.
 */
export const freeAuditView = (a: AccountAudit) => ({
  ...a,
  limited: true,
  insights: {
    ...a.insights,
    points_forts: a.insights.points_forts.slice(0, 1),
    points_faibles: a.insights.points_faibles.map((p) => ({ titre: p.titre, detail: '', solution: '' })),
    formats_gagnants: a.insights.formats_gagnants.map((f) => ({ titre: f.titre, pourquoi: '', video_id: f.video_id })),
    video_a_retravailler: { id: a.insights.video_a_retravailler.id, pourquoi: '', comment: '' },
    plan_semaine: a.insights.plan_semaine.map((p) => ({ jour: p.jour, idee: '', format: '', accroche: '' })),
    objectif_30_jours: '',
    accroches_qui_marchent: [],
    a_eviter: [],
  },
});

// ---------- Fiche créateur reçue de l'app (pour les autres analyses IA) ----------

/** Nettoie la fiche envoyée par l'app (on ne fait jamais confiance au contenu brut). */
export const sanitizeCard = (raw: any): CreatorCard | null => {
  let c = raw;
  if (typeof raw === 'string') {
    try { c = JSON.parse(raw); } catch { return null; }
  }
  if (!c || typeof c !== 'object') return null;
  const handle = normalizeHandle(c.handle);
  if (!handle) return null;
  return {
    handle,
    niche: str(c.niche, 60),
    style: str(c.style, 80),
    ton: str(c.ton, 40),
    public: str(c.public, 200),
    formats_gagnants: strArr(c.formats_gagnants, 3, 60),
    accroches_qui_marchent: strArr(c.accroches_qui_marchent, 4, 120),
    forces: strArr(c.forces, 4, 60),
    faiblesses: strArr(c.faiblesses, 4, 160),
    a_eviter: strArr(c.a_eviter, 3, 120),
    moyenne_vues: Math.max(0, num(c.moyenne_vues)),
    engagement: Math.max(0, Math.min(100, Number(c.engagement) || 0)),
    abonnes: Math.max(0, num(c.abonnes)),
    duree_ideale: str(c.duree_ideale, 40),
    meilleurs_creneaux: strArr(c.meilleurs_creneaux, 3, 40),
    updatedAt: str(c.updatedAt, 30),
  };
};

/** Bloc de prompt « ce qu'on sait de ce créateur », injecté dans l'analyse vidéo, les plans de tendance… */
export const cardPromptBlock = (c: CreatorCard | null | undefined) => {
  if (!c) return '';
  const l = (label: string, v: string | string[]) => {
    const val = Array.isArray(v) ? v.filter(Boolean).join(' ; ') : v;
    return val ? `- ${label} : ${val}` : '';
  };
  return `
CE QUE L'ON SAIT DE SON COMPTE TIKTOK @${c.handle} (bilan de ses vraies vidéos)
${[
  `- ${fmt(c.abonnes)} abonnés · ${fmt(c.moyenne_vues)} vues médianes par vidéo · engagement ${c.engagement}%`,
  l('Niche réelle', c.niche), l('Style', c.style), l('Ton', c.ton), l('Public', c.public),
  l('Formats qui marchent chez lui', c.formats_gagnants), l('Accroches qui marchent chez lui', c.accroches_qui_marchent),
  l('Ses forces', c.forces), l('Ses défauts récurrents', c.faiblesses), l('Ce qui fait baisser ses vues', c.a_eviter),
  l('Durée idéale pour lui', c.duree_ideale), l('Ses meilleurs créneaux', c.meilleurs_creneaux),
].filter(Boolean).join('\n')}
Utilise ces informations : compare ce que tu vois à ses habitudes (« comme sur tes vidéos qui marchent… », « tu retombes dans… »),
situe le potentiel par rapport à ses vues habituelles, garde son style et son ton, et vise d'abord ses défauts récurrents.
Ne cite pas ces chiffres s'ils ne servent pas le conseil.
`;
};

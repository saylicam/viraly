import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';
import { loadLatestTrends, trendsForNiche } from './trends';
import type { VideoPart } from './geminiVideo';
import { sanitizeCard, cardPromptBlock, type CreatorCard } from './accountAudit';

/**
 * Analyse vidéo v2.
 * - Prompt pensé pour des créateurs (face caméra, sketchs, tutos…) et personnalisé (niche, niveau, objectif).
 * - Réponse JSON structurée : notes par pilier, courbe de rétention estimée, moments clés minutés,
 *   priorité n°1, corrections concrètes.
 * - Robuste : si la réponse est invalide, on relance Gemini ; on n'invente jamais une analyse.
 * - Compatible : `toLegacy` recrée les anciens champs pour les versions de l'app déjà publiées.
 */

export interface AnalysisContext {
  niche?: string;
  level?: string;
  goal?: string;
  /** Fiche créateur issue du bilan de son compte TikTok (facultative) */
  card?: CreatorCard | null;
}

export interface Pilier { note: number; commentaire: string; conseil: string }
export interface TrendContext {
  sounds: { title: string; artist: string; stage?: string; url: string }[];
  formats: string[];
  hashtags: string[];
}
export interface AnalysisV2 {
  version: 2;
  duree_secondes: number;
  type_video: string;
  resume: string;
  score: number;
  verdict: string;
  avis: string;
  pret_a_publier: boolean;
  piliers: { accroche: Pilier; rythme: Pilier; image: Pilier; son: Pilier; message: Pilier };
  retention: { t: number; pct: number }[];
  moments: { t: number; type: 'fort' | 'faible'; titre: string; detail: string }[];
  priorite: { titre: string; pourquoi: string; action: string };
  points_forts: string[];
  points_faibles: string[];
  corrections: { moment: string; probleme: string; solution: string; comment: string; impact: 'fort' | 'moyen' | 'faible' }[];
  decoupage: { debut: number; fin: number; role: string; description: string }[];
  emotions: { humour: number; surprise: number; curiosite: number; emotion: number; inspiration: number };
  emotion_dominante: string;
  checklist: { point: string; ok: boolean; detail: string }[];
  accroches: { texte_ecran: string; phrase: string; pourquoi: string }[];
  tendances: { dans_la_tendance: boolean; explication: string; son_conseille: string; son_url: string; format_conseille: string; hashtags_du_moment: string[] };
  public: { cible: string; pourquoi: string };
  montage_ideal: { debut: number; fin: number; action: string; texte_ecran: string }[];
  score_potentiel: number;
  idees: string[];
  legende: string;
  hashtags: string[];
  meilleurs_horaires: string[];
  risque: { niveau: 'Faible' | 'Moyen' | 'Élevé'; detail: string };
  engagement: { likes: number; commentaires: number; partages: number };
}

export const PILLAR_KEYS = ['accroche', 'rythme', 'image', 'son', 'message'] as const;

const NICHES: Record<string, string> = {
  comedy: 'comédie / sketchs', music: 'musique', beauty: 'beauté / maquillage', education: 'éducation / astuces',
  gaming: 'gaming', fitness: 'fitness / sport', tech: 'tech', food: 'cuisine', travel: 'voyage',
};
const LEVELS: Record<string, string> = {
  beginner: 'débutant (peu de vidéos, peu de matériel)', intermediate: 'intermédiaire (moins de 10 k vues par vidéo)',
  advanced: 'avancé (10 k à 50 k vues)', pro: 'confirmé (plus de 50 k vues)',
};
const GOALS: Record<string, string> = {
  views: 'faire plus de vues', engagement: 'plus d’engagement (likes, commentaires, partages)',
  fanbase: 'construire une communauté fidèle', monetization: 'monétiser son contenu',
};

export const sanitizeContext = (raw: any): AnalysisContext => ({
  niche: NICHES[raw?.niche] ? raw.niche : undefined,
  level: LEVELS[raw?.level] ? raw.level : undefined,
  goal: GOALS[raw?.goal] ? raw.goal : undefined,
  card: sanitizeCard(raw?.creator),
});

// ---------- Schéma (sortie structurée Gemini) ----------

const pilier = {
  type: 'object',
  properties: { note: { type: 'integer' }, commentaire: { type: 'string' }, conseil: { type: 'string' } },
  required: ['note', 'commentaire', 'conseil'],
};

const SCHEMA = {
  type: 'object',
  properties: {
    duree_secondes: { type: 'number' },
    type_video: { type: 'string' },
    resume: { type: 'string' },
    score: { type: 'integer' },
    verdict: { type: 'string' },
    avis: { type: 'string' },
    pret_a_publier: { type: 'boolean' },
    piliers: {
      type: 'object',
      properties: { accroche: pilier, rythme: pilier, image: pilier, son: pilier, message: pilier },
      required: ['accroche', 'rythme', 'image', 'son', 'message'],
    },
    retention: {
      type: 'array',
      items: { type: 'object', properties: { t: { type: 'number' }, pct: { type: 'integer' } }, required: ['t', 'pct'] },
    },
    moments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          t: { type: 'number' },
          type: { type: 'string', enum: ['fort', 'faible'] },
          titre: { type: 'string' },
          detail: { type: 'string' },
        },
        required: ['t', 'type', 'titre', 'detail'],
      },
    },
    priorite: {
      type: 'object',
      properties: { titre: { type: 'string' }, pourquoi: { type: 'string' }, action: { type: 'string' } },
      required: ['titre', 'pourquoi', 'action'],
    },
    points_forts: { type: 'array', items: { type: 'string' } },
    points_faibles: { type: 'array', items: { type: 'string' } },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          moment: { type: 'string' }, probleme: { type: 'string' }, solution: { type: 'string' }, comment: { type: 'string' },
          impact: { type: 'string', enum: ['fort', 'moyen', 'faible'] },
        },
        required: ['moment', 'probleme', 'solution', 'comment', 'impact'],
      },
    },
    decoupage: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          debut: { type: 'number' }, fin: { type: 'number' },
          role: { type: 'string', enum: ['accroche', 'développement', 'moment fort', 'temps mort', 'chute', 'appel à l’action'] },
          description: { type: 'string' },
        },
        required: ['debut', 'fin', 'role', 'description'],
      },
    },
    emotions: {
      type: 'object',
      properties: { humour: { type: 'integer' }, surprise: { type: 'integer' }, curiosite: { type: 'integer' }, emotion: { type: 'integer' }, inspiration: { type: 'integer' } },
      required: ['humour', 'surprise', 'curiosite', 'emotion', 'inspiration'],
    },
    emotion_dominante: { type: 'string' },
    checklist: {
      type: 'array',
      items: { type: 'object', properties: { point: { type: 'string' }, ok: { type: 'boolean' }, detail: { type: 'string' } }, required: ['point', 'ok', 'detail'] },
    },
    accroches: {
      type: 'array',
      items: { type: 'object', properties: { texte_ecran: { type: 'string' }, phrase: { type: 'string' }, pourquoi: { type: 'string' } }, required: ['texte_ecran', 'phrase', 'pourquoi'] },
    },
    tendances: {
      type: 'object',
      properties: {
        dans_la_tendance: { type: 'boolean' }, explication: { type: 'string' }, son_conseille: { type: 'string' },
        format_conseille: { type: 'string' }, hashtags_du_moment: { type: 'array', items: { type: 'string' } },
      },
      required: ['dans_la_tendance', 'explication', 'son_conseille', 'format_conseille', 'hashtags_du_moment'],
    },
    public: { type: 'object', properties: { cible: { type: 'string' }, pourquoi: { type: 'string' } }, required: ['cible', 'pourquoi'] },
    montage_ideal: {
      type: 'array',
      items: {
        type: 'object',
        properties: { debut: { type: 'number' }, fin: { type: 'number' }, action: { type: 'string' }, texte_ecran: { type: 'string' } },
        required: ['debut', 'fin', 'action', 'texte_ecran'],
      },
    },
    score_potentiel: { type: 'integer' },
    idees: { type: 'array', items: { type: 'string' } },
    legende: { type: 'string' },
    hashtags: { type: 'array', items: { type: 'string' } },
    meilleurs_horaires: { type: 'array', items: { type: 'string' } },
    risque: {
      type: 'object',
      properties: { niveau: { type: 'string', enum: ['Faible', 'Moyen', 'Élevé'] }, detail: { type: 'string' } },
      required: ['niveau', 'detail'],
    },
    engagement: {
      type: 'object',
      properties: { likes: { type: 'integer' }, commentaires: { type: 'integer' }, partages: { type: 'integer' } },
      required: ['likes', 'commentaires', 'partages'],
    },
  },
  required: [
    'duree_secondes', 'type_video', 'resume', 'score', 'verdict', 'avis', 'pret_a_publier', 'piliers', 'retention',
    'moments', 'priorite', 'points_forts', 'points_faibles', 'corrections', 'decoupage', 'emotions', 'emotion_dominante',
    'checklist', 'accroches', 'tendances', 'public', 'montage_ideal', 'score_potentiel', 'idees', 'legende', 'hashtags',
    'meilleurs_horaires', 'risque', 'engagement',
  ],
};

// ---------- Tendances de la semaine (injectées dans le prompt) ----------

export const trendContextFor = async (niche?: string): Promise<TrendContext | null> => {
  try {
    const snap = await loadLatestTrends();
    if (!snap) return null;
    const t: any = trendsForNiche(snap, niche);
    return {
      sounds: (t.sounds ?? []).slice(0, 8).map((x: any) => ({ title: x.title, artist: x.artist, stage: x.stage, url: x.url })),
      formats: (t.formats ?? []).map((v: any) => String(v.description ?? '').replace(/#\S+/g, '').replace(/\s+/g, ' ').trim()).filter((d: string) => d.length > 12).slice(0, 6).map((d: string) => d.slice(0, 140)),
      hashtags: (t.hashtags ?? []).slice(0, 12).map((h: any) => h.tag),
    };
  } catch (e: any) {
    console.warn('⚠️ Tendances indisponibles pour l’analyse :', e?.message ?? e);
    return null;
  }
};

// ---------- Prompt ----------

const STAGE_WORDS: Record<string, string> = { emerging: 'en pleine montée', peak: 'au sommet', declining: 'en déclin' };

export const buildPrompt = (ctx: AnalysisContext, trends?: TrendContext | null) => {
  const creator = [
    ctx.niche ? `- Niche : ${NICHES[ctx.niche]}` : '- Niche : non précisée (déduis-la de la vidéo)',
    ctx.level ? `- Niveau : ${LEVELS[ctx.level]}` : '',
    ctx.goal ? `- Objectif : ${GOALS[ctx.goal]}` : '',
  ].filter(Boolean).join('\n');

  const trendBlock = trends && (trends.sounds.length || trends.formats.length || trends.hashtags.length) ? `
TENDANCES TIKTOK DE CETTE SEMAINE (données réelles, collectées cette semaine aux États-Unis et en France${ctx.niche ? `, niche ${NICHES[ctx.niche]}` : ''})
Sons qui cartonnent :
${trends.sounds.map((t, i) => `${i + 1}. « ${t.title} »${t.artist ? ` – ${t.artist}` : ''}${t.stage ? ` (${STAGE_WORDS[t.stage] ?? t.stage})` : ''}`).join('\n')}
Formats de vidéos qui marchent (légendes de vidéos très vues) :
${trends.formats.map((f) => `- ${f}`).join('\n')}
Hashtags qui reviennent : ${trends.hashtags.map((h) => `#${h}`).join(' ')}
Utilise ces données pour juger si la vidéo est dans l'air du temps et pour conseiller un son, un format et des hashtags.
Pour "son_conseille", choisis UNIQUEMENT un son de cette liste (recopie son titre exact) qui irait vraiment avec l'ambiance de la vidéo, sinon "".
Pour "hashtags_du_moment", prends UNIQUEMENT des hashtags de cette liste en rapport direct avec le SUJET de la vidéo ; s'il n'y en a aucun, renvoie [].
Ne force jamais une tendance qui n'a rien à voir avec la vidéo.
` : `
TENDANCES : pas de données de la semaine disponibles. Base-toi sur tes connaissances des codes TikTok actuels ; laisse "son_conseille" vide.
`;

  return `Tu es le coach TikTok de Viraly : expert des formats courts (TikTok, Reels, Shorts), exigeant, honnête et bienveillant.
Un créateur t'envoie sa vidéo AVANT de la publier. Regarde-la et écoute-la EN ENTIER, image par image, puis fais-lui une analyse
complète, précise et pédagogique : il doit comprendre exactement ce qui marche, ce qui ne marche pas, POURQUOI, et COMMENT corriger.

LE CRÉATEUR
${creator}
${cardPromptBlock(ctx.card)}Adapte tes conseils à sa niche et à son niveau (un débutant a besoin d'étapes simples, faisables avec un téléphone et CapCut ou l'éditeur TikTok).
${trendBlock}
COMMENT NOTER (0 à 100, réaliste et cohérent)
- 85-100 : prête à cartonner, presque rien à changer.
- 70-84 : très bonne vidéo, quelques réglages.
- 55-69 : correcte, des défauts limitent sa portée.
- 40-54 : moyenne, plusieurs points importants à revoir.
- moins de 40 : pas encore adaptée au format court.
Le score global reflète surtout l'accroche et le rythme (ce qui garde les gens jusqu'au bout).

CE QUE TU VOIS : "decoupage"
Découpe la vidéo en 3 à 8 séquences (debut et fin en secondes). Pour chaque séquence, décris précisément ce qu'on voit
(plan, cadrage, gestes, décor, texte affiché) et ce qu'on entend (phrases dites, entre guillemets si possible, musique, bruitages),
et donne son rôle : accroche, développement, moment fort, temps mort, chute ou appel à l'action.

LES 5 PILIERS (note 0-100)
Pour chaque pilier : "commentaire" = ce que tu as vu ou entendu, précisément (1-2 phrases, cite des moments) ;
"conseil" = comment l'améliorer concrètement (1-2 phrases). Si le pilier est excellent, le conseil dit comment le garder.
- accroche : les 2 premières secondes donnent-elles envie de rester ? (texte à l'écran, mouvement, phrase choc, résultat montré d'abord)
- rythme : coupes, temps morts, longueur, dynamisme.
- image : cadrage vertical, lumière, netteté, lisibilité des textes, zones cachées par l'interface TikTok.
- son : voix claire, musique ou son tendance, niveau sonore, sous-titres si on parle.
- message : l'idée est-elle claire, originale, avec une chute ou un appel à l'action ?

ÉMOTIONS
"emotions" : ce que les spectateurs vont ressentir, 0-100 pour humour, surprise, curiosité, émotion (touché, ému), inspiration.
"emotion_dominante" : l'émotion principale en 1 à 3 mots (ex. "Curiosité", "Rire", "Envie d'essayer").

CODES TIKTOK : "checklist"
Vérifie 7 points, dans cet ordre, avec ok true/false et un détail court sur CETTE vidéo :
1. "Format vertical 9:16"  2. "Accroche en moins de 2 secondes"  3. "Texte à l'écran au début"  4. "Sous-titres"
5. "Durée adaptée au contenu"  6. "Son ou musique qui porte la vidéo"  7. "Fin qui donne envie de réagir ou de revoir"

RÉTENTION ESTIMÉE
"retention" : 6 à 10 points répartis de 0 à la fin (t en secondes, pct = % de spectateurs encore là). Premier point { t: 0, pct: 100 }.
La courbe ne remonte jamais. Fais-la chuter là où la vidéo perd de l'intérêt (temps morts, longueurs).

MOMENTS CLÉS
"moments" : 2 à 5 moments précis : "fort" (ce qui marche) ou "faible" (où on risque de décrocher), titre court, détail concret.

PRIORITÉ, CORRECTIONS ET ACCROCHES
- "priorite" : LA chose à corriger en premier pour gagner le plus de vues (titre, pourquoi c'est important, action concrète).
- "corrections" : 3 à 6 corrections, la plus importante d'abord. Pour chacune :
  "moment" ("0:03" ou "" si c'est global), "probleme" (ce qui ne va pas), "solution" (quoi faire),
  "comment" (comment le faire concrètement, étape par étape : dans quel outil (CapCut ou l'éditeur TikTok), quel bouton ou quelle fonction,
  à quel moment de la vidéo, et un exemple de texte si besoin. Jamais "utilise ton logiciel de montage" sans dire comment),
  "impact" (fort, moyen ou faible : ce que ça changerait sur les vues).
- "accroches" : 3 NOUVELLES accroches, différentes entre elles ET différentes de l'ouverture actuelle de la vidéo
  (ex. commencer par la fin, par une question, par un chiffre, par le moment le plus fort) : texte à l'écran (max 8 mots),
  phrase ou action d'ouverture, et pourquoi elle marcherait.
- "montage_ideal" : le nouvel ordre conseillé de la vidéo, 4 à 7 étapes, en utilisant les passages EXISTANTS (debut/fin = passage
  de la vidéo actuelle à utiliser, en secondes), "action" = quoi faire avec ce passage (garder, couper un bout, accélérer, placer en premier…),
  "texte_ecran" = texte à afficher pendant ce passage (ou ""). C'est le plan qu'un monteur suivrait pour la version idéale.
- "score_potentiel" : la note réaliste que la vidéo pourrait avoir une fois tes corrections appliquées (supérieure au score actuel).
- "points_forts" et "points_faibles" : 3 à 4 chacun, spécifiques à CETTE vidéo, expliqués (pas juste 2 mots).

TENDANCES ET PUBLIC
- "tendances" : "dans_la_tendance" (true/false), "explication" (2 phrases : en quoi la vidéo suit ou non les tendances actuelles),
  "son_conseille", "format_conseille" (un format qui marche en ce moment et qu'il pourrait adapter, 1 phrase), "hashtags_du_moment" (sans #).
- "public" : "cible" (le public qui va le plus aimer, ex. "18-24 ans fans de tech"), "pourquoi" (1 phrase).
- "idees" : 2 ou 3 idées de prochaines vidéos ou de variantes dans le même esprit.

PUBLICATION
- "legende" : légende prête à copier, 1 à 2 lignes, avec 1 ou 2 emojis, sans hashtags.
- "hashtags" : 3 à 5 hashtags sans le #, en minuscules, qui décrivent le VRAI sujet de la vidéo (ce qu'on voit et entend), pas seulement
  la niche déclarée du créateur : si la vidéo parle de parfum, mets des hashtags parfum, même si le créateur fait de la musique.
  Au maximum 1 hashtag large (fyp, pourtoi).
- "meilleurs_horaires" : 3 créneaux au format "18:00" adaptés à la niche (heure française).

RISQUE
"risque" : Faible / Moyen / Élevé + détail. Moyen si watermark d'une autre appli, extrait TV/film, musique protégée évidente.
Élevé si contenu choquant, dangereux ou haineux. Sinon Faible avec "Aucun risque détecté".

AUTRES CHAMPS
- "duree_secondes" : durée de la vidéo.
- "type_video" : format détecté en 2-4 mots avec un emoji (ex. "🎤 Face caméra", "😂 Sketch", "🍳 Tuto recette", "🎬 Edit").
- "resume" : ce qui se passe dans la vidéo, en 2-3 phrases. Si c'est un extrait connu (film, série, artiste), nomme-le.
- "verdict" : 4 à 8 mots qui résument ton avis (ex. "Bonne idée, accroche trop lente").
- "avis" : ton avis de coach en 3-4 phrases : ce qui marche, le principal frein, et ce que ça donnerait une fois corrigé.
- "pret_a_publier" : true seulement si plus aucune correction importante.
- "engagement" : estimation 0-100 du potentiel de likes, commentaires et partages.

COHÉRENCE (vérifie avant de répondre)
- La checklist, les piliers, les points faibles et les corrections doivent dire la même chose : si un point est validé (ok: true)
  dans la checklist, ne le cite pas comme problème ailleurs, et inversement.
- Une même remarque ne doit pas être répétée partout : les "moments" décrivent ce qui se passe à un instant, les "corrections" disent quoi faire,
  les "points_faibles" résument les grandes faiblesses.
- Le score global, les piliers et le verdict doivent être cohérents entre eux.

STYLE
Français, tutoiement, phrases claires, sans jargon anglais (dis "accroche" et pas "hook", "rétention" et pas "watchtime").
Base-toi uniquement sur ce que tu vois et entends : cite des moments précis, des mots dits, des éléments visibles.
Jamais de phrase générique qui pourrait s'appliquer à n'importe quelle vidéo.
Réponds UNIQUEMENT avec le JSON demandé.`;
};

// ---------- Appel Gemini ----------

/**
 * Réglages pour aller plus vite :
 * - mediaResolution LOW : Gemini regarde chaque image en basse définition (~4x moins de calcul).
 *   Largement suffisant pour juger un cadrage, un texte à l'écran, une accroche.
 * - thinkingLevel minimal : pas de longue « réflexion » cachée avant de répondre.
 * Si le modèle refuse un de ces réglages, on repasse automatiquement aux réglages simples.
 */
const BASE_CONFIG = {
  temperature: 0.4,
  topP: 0.95,
  maxOutputTokens: 12288,
  responseMimeType: 'application/json',
  responseSchema: SCHEMA as any,
};
const FAST_CONFIG = {
  ...BASE_CONFIG,
  mediaResolution: 'MEDIA_RESOLUTION_LOW',
  thinkingConfig: { thinkingLevel: 'minimal' },
};

let fastSupported = true;
const models: Record<string, any> = {};
const getModel = () => {
  const key = fastSupported ? 'fast' : 'base';
  if (!models[key]) {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY as string);
    models[key] = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      generationConfig: (fastSupported ? FAST_CONFIG : BASE_CONFIG) as any,
    });
  }
  return models[key];
};

/** Le modèle a refusé un réglage rapide (400 « Invalid argument / unknown field ») */
const isConfigRejected = (e: any) =>
  fastSupported && /400|invalid argument|unknown name|thinking|media_?resolution/i.test(String(e?.message ?? ''));

const withTimeout = <T>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

const extractJson = (text: string) => {
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a !== -1 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
};

/** Erreurs pour lesquelles réessayer a du sens (surcharge, coupure, réponse invalide). */
const isRetryable = (e: any) => {
  const msg = String(e?.message ?? '');
  if (/safety|blocked|API key|401|403|quota|429/i.test(msg)) return false;
  return true;
};

export class AnalysisError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export const analyzeVideo = async (video: VideoPart, ctx: AnalysisContext, trends?: TrendContext | null): Promise<AnalysisV2> => {
  const prompt = buildPrompt(ctx, trends);
  let lastError: any = null;
  const begin = Date.now();

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const started = Date.now();
      // Le premier essai a le temps de finir même pour une vidéo d'une minute ou plus ;
      // les suivants se contentent de ce qui reste avant que l'app abandonne (~3 min 30)
      const budget = attempt === 1 ? 150_000 : Math.max(45_000, 185_000 - (Date.now() - begin));
      const result: any = await withTimeout(getModel().generateContent({
        contents: [{ role: 'user', parts: [video, { text: prompt }] }],
      }), budget);
      const response = await result.response;
      let text = '';
      try { text = response.text(); } catch {
        text = response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ?? '';
      }
      const analysis = normalizeV2(extractJson(text), trends);
      console.log(`✅ Analyse v2 en ${((Date.now() - started) / 1000).toFixed(1)} s (essai ${attempt}) — score ${analysis.score}`);
      return analysis;
    } catch (e: any) {
      lastError = e;
      if (isConfigRejected(e)) {
        console.warn('⚠️ Réglages rapides refusés par Gemini, retour aux réglages simples :', e?.message ?? e);
        fastSupported = false;
        attempt--; // ne compte pas comme un essai
        continue;
      }
      console.warn(`⚠️ Analyse : essai ${attempt} échoué —`, e?.message ?? e);
      // Pas de nouvel essai si on a déjà attendu longtemps (l'app abandonne vers 3 min 30)
      if (!isRetryable(e) || attempt === 3 || Date.now() - begin > 140_000) break;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError ?? new AnalysisError('ANALYSIS_FAILED', 'Analyse impossible');
};

// ---------- Validation / nettoyage ----------

const clamp = (n: unknown, min = 0, max = 100, fallback?: number) => {
  const v = Number(n);
  if (!Number.isFinite(v)) {
    if (fallback === undefined) throw new Error('nombre manquant');
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(v)));
};
const str = (v: unknown, max = 400) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const list = (v: unknown, max: number, len = 220) =>
  (Array.isArray(v) ? v : []).map((x) => str(x, len)).filter(Boolean).slice(0, max);
const HOUR = /^([01]?\d|2[0-3])[:h]([0-5]\d)$/;

/** Vérifie et nettoie la réponse. Lève une erreur si l'essentiel manque (→ nouvel essai). */
export const normalizeV2 = (raw: any, trends?: TrendContext | null): AnalysisV2 => {
  if (!raw || typeof raw !== 'object') throw new Error('réponse vide');

  const piliers: any = {};
  for (const k of PILLAR_KEYS) {
    const p = raw.piliers?.[k];
    if (!p) throw new Error(`pilier ${k} manquant`);
    piliers[k] = { note: clamp(p.note), commentaire: str(p.commentaire, 300), conseil: str(p.conseil, 300) };
  }

  const score = clamp(raw.score);
  const resume = str(raw.resume, 500);
  const avis = str(raw.avis, 700);
  if (!resume || !avis) throw new Error('résumé ou avis manquant');

  const duree = Math.max(1, Math.min(600, Number(raw.duree_secondes) || 0)) || 15;

  // Courbe : triée, commence à 100 %, ne remonte jamais, dans la durée de la vidéo
  let retention = (Array.isArray(raw.retention) ? raw.retention : [])
    .map((p: any) => ({ t: Math.max(0, Math.min(duree, Number(p?.t) || 0)), pct: clamp(p?.pct, 0, 100, 0) }))
    .sort((a: any, b: any) => a.t - b.t);
  if (retention.length < 3) throw new Error('courbe de rétention incomplète');
  retention = retention.filter((p: any, i: number, arr: any[]) => i === arr.length - 1 || p.t !== arr[i + 1].t);
  if (retention.length < 3) throw new Error('courbe de rétention incomplète');
  retention[0] = { t: 0, pct: 100 };
  for (let i = 1; i < retention.length; i++) retention[i].pct = Math.min(retention[i].pct, retention[i - 1].pct);

  const moments = (Array.isArray(raw.moments) ? raw.moments : [])
    .map((m: any) => ({
      t: Math.max(0, Math.min(duree, Number(m?.t) || 0)),
      type: m?.type === 'fort' ? 'fort' as const : 'faible' as const,
      titre: str(m?.titre, 60),
      detail: str(m?.detail, 220),
    }))
    .filter((m: any) => m.titre)
    .sort((a: any, b: any) => a.t - b.t)
    .slice(0, 5);

  const corrections = (Array.isArray(raw.corrections) ? raw.corrections : [])
    .map((c: any) => ({
      moment: /^\d{1,2}:\d{2}$/.test(str(c?.moment, 8)) ? str(c?.moment, 8) : '',
      probleme: str(c?.probleme, 200),
      solution: str(c?.solution, 260),
      comment: str(c?.comment, 320),
      impact: (['fort', 'moyen', 'faible'].includes(c?.impact) ? c.impact : 'moyen') as 'fort' | 'moyen' | 'faible',
    }))
    .filter((c: any) => c.probleme && c.solution)
    .slice(0, 6);

  const priorite = {
    titre: str(raw.priorite?.titre, 80) || corrections[0]?.probleme || 'Renforcer ton accroche',
    pourquoi: str(raw.priorite?.pourquoi, 240),
    action: str(raw.priorite?.action, 260) || corrections[0]?.solution || '',
  };

  const hashtags = Array.from(new Set(list(raw.hashtags, 8, 40)
    .map((h) => h.replace(/^#+/, '').replace(/\s+/g, '').toLowerCase())
    .filter((h) => h.length >= 2 && h.length <= 30 && !/(.)\1{3,}/.test(h)))).slice(0, 5);

  const horaires = list(raw.meilleurs_horaires, 3, 8)
    .map((h) => { const m = h.match(HOUR); return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null; })
    .filter(Boolean) as string[];

  const niveau = ['Faible', 'Moyen', 'Élevé'].includes(raw.risque?.niveau) ? raw.risque.niveau : 'Faible';

  const ROLES = ['accroche', 'développement', 'moment fort', 'temps mort', 'chute', 'appel à l’action'];
  const decoupage = (Array.isArray(raw.decoupage) ? raw.decoupage : [])
    .map((d: any) => {
      const debut = Math.max(0, Math.min(duree, Number(d?.debut) || 0));
      const fin = Math.max(debut, Math.min(duree, Number(d?.fin) || debut));
      return { debut, fin, role: ROLES.includes(d?.role) ? d.role : 'développement', description: str(d?.description, 360) };
    })
    .filter((d: any) => d.description)
    .sort((a: any, b: any) => a.debut - b.debut)
    .slice(0, 8);

  const emotions = {
    humour: clamp(raw.emotions?.humour, 0, 100, 0),
    surprise: clamp(raw.emotions?.surprise, 0, 100, 0),
    curiosite: clamp(raw.emotions?.curiosite, 0, 100, 0),
    emotion: clamp(raw.emotions?.emotion, 0, 100, 0),
    inspiration: clamp(raw.emotions?.inspiration, 0, 100, 0),
  };

  const checklist = (Array.isArray(raw.checklist) ? raw.checklist : [])
    .map((c: any) => ({ point: str(c?.point, 60), ok: c?.ok === true, detail: str(c?.detail, 200) }))
    .filter((c: any) => c.point)
    .slice(0, 8);

  const accroches = (Array.isArray(raw.accroches) ? raw.accroches : [])
    .map((a: any) => ({ texte_ecran: str(a?.texte_ecran, 80), phrase: str(a?.phrase, 200), pourquoi: str(a?.pourquoi, 220) }))
    .filter((a: any) => a.texte_ecran || a.phrase)
    .slice(0, 3);

  const montage = (Array.isArray(raw.montage_ideal) ? raw.montage_ideal : [])
    .map((m: any) => {
      const debut = Math.max(0, Math.min(duree, Number(m?.debut) || 0));
      const fin = Math.max(debut, Math.min(duree, Number(m?.fin) || debut));
      return { debut, fin, action: str(m?.action, 240), texte_ecran: str(m?.texte_ecran, 90) };
    })
    .filter((m: any) => m.action)
    .slice(0, 7);
  const potentiel = Math.max(score, clamp(raw.score_potentiel, 0, 100, score));

  // Son conseillé : on ne garde qu'un son réellement présent dans les tendances (avec son lien TikTok)
  const wanted = str(raw.tendances?.son_conseille, 120).toLowerCase().replace(/[«»"]/g, '').trim();
  const match = wanted && trends?.sounds.find((t) => {
    const title = t.title.toLowerCase();
    return title === wanted || title.includes(wanted) || wanted.includes(title);
  });
  const knownTags = new Set((trends?.hashtags ?? []).map((h) => h.toLowerCase()));
  const tagsDuMoment = list(raw.tendances?.hashtags_du_moment, 6, 40)
    .map((h) => h.replace(/^#+/, '').replace(/\s+/g, '').toLowerCase())
    .filter((h) => (knownTags.size ? knownTags.has(h) : h.length >= 2))
    .slice(0, 4);

  return {
    version: 2,
    duree_secondes: duree,
    type_video: str(raw.type_video, 40) || '🎥 Vidéo',
    resume,
    score,
    verdict: str(raw.verdict, 80) || (score >= 70 ? 'Très bonne vidéo' : score >= 55 ? 'Bonne base, à affiner' : 'Plusieurs points à revoir'),
    avis,
    pret_a_publier: raw.pret_a_publier === true && score >= 70,
    piliers,
    retention,
    moments,
    priorite,
    points_forts: list(raw.points_forts, 4, 260),
    points_faibles: list(raw.points_faibles, 4, 260),
    corrections,
    decoupage,
    emotions,
    emotion_dominante: str(raw.emotion_dominante, 40),
    checklist,
    accroches,
    tendances: {
      dans_la_tendance: raw.tendances?.dans_la_tendance === true,
      explication: str(raw.tendances?.explication, 360),
      son_conseille: match ? match.title : '',
      son_url: match ? match.url : '',
      format_conseille: str(raw.tendances?.format_conseille, 240),
      hashtags_du_moment: tagsDuMoment,
    },
    public: { cible: str(raw.public?.cible, 80), pourquoi: str(raw.public?.pourquoi, 220) },
    montage_ideal: montage,
    score_potentiel: potentiel,
    idees: list(raw.idees, 3),
    legende: str(raw.legende, 300),
    hashtags,
    meilleurs_horaires: horaires.length ? horaires : ['12:00', '18:00', '20:00'],
    risque: { niveau, detail: str(raw.risque?.detail, 220) || 'Aucun risque détecté' },
    engagement: {
      likes: clamp(raw.engagement?.likes, 0, 100, 50),
      commentaires: clamp(raw.engagement?.commentaires, 0, 100, 40),
      partages: clamp(raw.engagement?.partages, 0, 100, 30),
    },
  };
};

// ---------- Compatibilité avec les anciennes versions de l'app ----------

const levelWord = (n: number) => (n >= 70 ? 'Élevé' : n >= 45 ? 'Moyen' : 'Faible');
const pad = <T>(arr: T[], min: number, filler: T[]) => (arr.length >= min ? arr : [...arr, ...filler].slice(0, Math.max(min, arr.length)));

export const toLegacy = (a: AnalysisV2) => {
  const p = a.piliers;
  const half = a.retention.find((r) => r.pct < 50);
  const watch = half ? `${Math.max(1, Math.round(half.t * 0.7))}-${Math.round(half.t)}s` : `${Math.round(a.duree_secondes * 0.7)}-${Math.round(a.duree_secondes)}s`;
  const fixes = a.corrections.map((c) => (c.moment ? `${c.moment} · ${c.solution}` : c.solution));
  const pillarTips = PILLAR_KEYS.map((k) => ({ icone: { accroche: '⚡', rythme: '✂️', image: '🎥', son: '🎵', message: '💬' }[k], titre: k.charAt(0).toUpperCase() + k.slice(1), texte: p[k].commentaire }));
  const engagementType = (Object.entries({ likes: a.engagement.likes, commentaires: a.engagement.commentaires, partages: a.engagement.partages })
    .sort((x, y) => y[1] - x[1]).slice(0, 2).map(([k]) => k).join(' / '));
  const emoji = a.score >= 85 ? '🎯' : a.score >= 70 ? '💡' : a.score >= 55 ? '👍' : a.score >= 40 ? '🛠️' : '🔧';

  return {
    resume_video: { court: a.resume, long: `${a.resume} ${a.avis}`.trim() },
    avis_global: { court: a.avis, long: a.avis },
    pourquoi_ca_perce: { preview: a.points_forts.slice(0, 3), complet: a.points_forts },
    pourquoi_ca_floppe: { preview: a.points_faibles.slice(0, 3), complet: a.points_faibles },
    conseils_rapides: pad(a.corrections.map((c) => ({ icone: '🛠️', titre: c.probleme.slice(0, 50), texte: c.solution })), 4, pillarTips),
    conseils_amelioration: { preview: fixes.slice(0, 3), complet: fixes },
    score_emotionnel: { confiance_charisme: p.message.note, intensite: Math.max(a.emotions.surprise, a.emotions.humour), impact_visuel: p.image.note, nostalgie: a.emotions.emotion },
    micro_metrics: { potentiel_viral: levelWord(a.score), watchtime_estime: watch, audio_tendance: p.son.note >= 70 ? 'Oui' : 'Non', public_cible: 'Tout public', type_engagement: engagementType },
    tags_rapides: { potentiel_viral: levelWord(a.score), watchtime_optimal: watch, audio_tendance: p.son.note >= 70 ? 'Oui' : 'Non', public_cible: 'Tout public', type_engagement: engagementType },
    verdict_express: a.verdict,
    indice_risque: a.risque.niveau,
    indice_risque_detail: a.risque.detail,
    micro_indicateurs: { audio: p.son.note, montage: p.rythme.note, trendiness: p.accroche.note },
    inspiration_ia: a.idees,
    punchline: a.verdict,
    verdict_final: { emoji, titre: a.verdict, message: a.avis },
    caption: a.legende,
    hashtags: a.hashtags.map((h) => `#${h}`),
    score_sur_100: a.score,
    score_titre: a.verdict,
    phrase_motivante: a.score >= 70 ? 'Continue comme ça, ton style s’affine !' : 'Du potentiel : quelques réglages et ça peut décoller.',
    type_video_detecte: a.type_video,
    potentiel_partage: { potentiel_like: a.engagement.likes, potentiel_commentaire: a.engagement.commentaires, potentiel_partage: a.engagement.partages },
    optimisation_express: (fixes.length ? fixes : a.points_faibles).slice(0, 5),
    chance_trend: `${Math.round(a.score * 0.5)}%`,
    vues_attendues: '—',
    niveau_confiance: 'Moyen',
    meilleurs_horaires: a.meilleurs_horaires,
  };
};

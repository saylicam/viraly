import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';
import type { TrendsSnapshot, TrendSound, TrendVideo } from './trends';
import { cardPromptBlock, type CreatorCard } from './accountAudit';

/**
 * « Refais cette tendance à ta façon » : à partir d'un son ou d'une vidéo tendance, Gemini
 * écrit un plan de tournage adapté à la niche et au niveau du créateur.
 * Appel texte uniquement (pas de vidéo envoyée) : rapide et peu coûteux.
 */

const NICHE_LABELS: Record<string, string> = {
  comedy: 'comédie / humour', music: 'musique', beauty: 'beauté / maquillage', education: 'éducation / astuces',
  gaming: 'gaming', fitness: 'fitness / sport', tech: 'tech', food: 'cuisine', travel: 'voyage',
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'débutant (peu de matériel, peu d’expérience du montage)',
  intermediate: 'intermédiaire', advanced: 'avancé', pro: 'professionnel',
};

export interface RemixPlan {
  titre: string;
  concept: string;
  pourquoi_ca_marche: string;
  accroche: { texte_ecran: string; phrase: string; conseil: string };
  plans: { moment: string; action: string; texte_ecran?: string }[];
  son: { titre: string; conseil: string };
  legende: string;
  hashtags: string[];
  meilleur_moment: string;
  duree_conseillee: string;
  astuce_pro: string;
}

let model: any = null;
const getModel = () => {
  if (!model) {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY as string);
    model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
    });
  }
  return model;
};

// Même demande = même réponse pendant 24 h (évite de repayer l'appel)
const cache = new Map<string, { plan: RemixPlan; at: number }>();
const DAY = 24 * 3600 * 1000;

export const findTrendItem = (snap: TrendsSnapshot, kind: 'sound' | 'video', id: string) => {
  if (kind === 'sound') return snap.sounds.find((s) => s.id === id) ?? null;
  return [...snap.videos, ...snap.formats].find((v) => v.id === id) ?? null;
};

export const describe = (kind: 'sound' | 'video', item: TrendSound | TrendVideo) => {
  if (kind === 'sound') {
    const s = item as TrendSound;
    return [
      `Son tendance : « ${s.title} »${s.artist ? ` de ${s.artist}` : ''}.`,
      s.usageCount ? `Utilisé dans ${s.usageCount} vidéos TikTok.` : '',
      `Présent ${s.markets.includes('US') ? 'aux États-Unis' : ''}${s.markets.length > 1 ? ' et ' : ''}${s.markets.includes('FR') ? 'en France' : ''}.`,
      s.topVideo ? `Vidéo la plus vue avec ce son (${s.topVideo.views} vues) : « ${s.topVideo.description} ».` : '',
    ].filter(Boolean).join(' ');
  }
  const v = item as TrendVideo;
  return [
    `Vidéo tendance de @${v.author} (${v.views} vues, ${v.market === 'US' ? 'États-Unis' : 'France'}).`,
    `Légende : « ${v.description} ».`,
    v.soundTitle ? `Son utilisé : « ${v.soundTitle} ».` : '',
    v.hashtags?.length ? `Hashtags : ${v.hashtags.map((h) => '#' + h).join(' ')}.` : '',
  ].filter(Boolean).join(' ');
};

export const generateRemix = async (
  kind: 'sound' | 'video',
  item: TrendSound | TrendVideo,
  niche?: string,
  level?: string,
  card?: CreatorCard | null
): Promise<RemixPlan> => {
  const key = `${kind}:${item.id}:${niche ?? ''}:${level ?? ''}:${card?.handle ?? ''}:${card?.updatedAt ?? ''}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < DAY) return hit.plan;

  const prompt = `Tu es un coach TikTok francophone expert des tendances. Un créateur veut reprendre cette tendance à sa façon.

TENDANCE
${describe(kind, item)}

CRÉATEUR
- Niche : ${NICHE_LABELS[niche ?? ''] ?? 'généraliste'}
- Niveau : ${LEVEL_LABELS[level ?? ''] ?? 'débutant'}
${cardPromptBlock(card)}${card ? 'Adapte le plan à SON style et à SA niche réelle (formats qui marchent déjà chez lui).\n' : ''}
Écris un plan de tournage concret, original et réaliste pour ce créateur (pas une copie de la vidéo d'origine) :
adapte la tendance à sa niche, en français naturel et dynamique, tutoiement, sans jargon. Vidéo courte verticale.
Réponds UNIQUEMENT en JSON avec exactement cette structure :
{
  "titre": "nom accrocheur de l'idée (max 6 mots)",
  "concept": "l'idée en 1 à 2 phrases",
  "pourquoi_ca_marche": "pourquoi cette tendance fonctionne en ce moment (1 phrase)",
  "accroche": { "texte_ecran": "texte affiché dans les 2 premières secondes (max 8 mots)", "phrase": "première phrase dite ou action d'ouverture", "conseil": "conseil pour réussir l'accroche" },
  "plans": [ { "moment": "0-2 s", "action": "ce qu'on filme / fait", "texte_ecran": "texte à l'écran (optionnel)" } ],
  "son": { "titre": "son à utiliser", "conseil": "quel passage du son utiliser et comment caler le montage dessus" },
  "legende": "légende prête à copier (avec emojis, sans hashtags)",
  "hashtags": ["5 hashtags sans #, mélange niche + tendance + 1 large"],
  "meilleur_moment": "jour et créneau conseillés pour poster",
  "duree_conseillee": "ex. 12 à 15 secondes",
  "astuce_pro": "une astuce concrète pour se démarquer"
}
Entre 4 et 6 plans.`;

  const result = await getModel().generateContent(prompt);
  const text = result.response.text();
  const plan = JSON.parse(text.replace(/^```json\s*|```$/g, '').trim()) as RemixPlan;
  if (!plan?.titre || !Array.isArray(plan.plans)) throw new Error('Plan incomplet');
  plan.hashtags = (plan.hashtags ?? []).map((h) => String(h).replace(/^#/, '')).slice(0, 6);
  cache.set(key, { plan, at: Date.now() });
  return plan;
};

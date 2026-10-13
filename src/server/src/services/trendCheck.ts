import { cardPromptBlock, type CreatorCard } from './accountAudit';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env';
import { prepareVideo } from './geminiVideo';
import type { RemixPlan } from './remix';

/**
 * « Vérifie ma version » : le créateur a tourné sa vidéo à partir d'un plan de tendance.
 * Gemini regarde la vidéo et la compare au plan (accroche, étapes, rythme) pour dire
 * précisément quoi corriger avant de publier.
 */

export interface TrendCheckResult {
  score: number;
  pret_a_publier: boolean;
  verdict: string;
  accroche: { statut: 'ok' | 'a_corriger'; constat: string; conseil: string };
  etapes: { moment: string; attendu: string; statut: 'ok' | 'partiel' | 'manquant'; commentaire: string }[];
  corrections: { moment: string; probleme: string; solution: string }[];
  points_forts: string[];
  touche_perso: string;
}

let model: any = null;
const getModel = () => {
  if (!model) {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY as string);
    model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL,
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    });
  }
  return model;
};

const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const str = (v: unknown, max = 400) => String(v ?? '').trim().slice(0, max);

/** Le plan vient de l'app : on ne garde que les champs utiles, bornés. */
export const sanitizePlan = (raw: unknown): RemixPlan | null => {
  try {
    const p: any = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!p || typeof p !== 'object' || !Array.isArray(p.plans)) return null;
    return {
      titre: str(p.titre, 120),
      concept: str(p.concept),
      pourquoi_ca_marche: str(p.pourquoi_ca_marche),
      accroche: { texte_ecran: str(p.accroche?.texte_ecran, 120), phrase: str(p.accroche?.phrase, 300), conseil: str(p.accroche?.conseil, 300) },
      plans: p.plans.slice(0, 8).map((s: any) => ({ moment: str(s?.moment, 30), action: str(s?.action, 300), texte_ecran: str(s?.texte_ecran, 120) })),
      son: { titre: str(p.son?.titre, 150), conseil: str(p.son?.conseil, 300) },
      legende: str(p.legende, 300),
      hashtags: Array.isArray(p.hashtags) ? p.hashtags.slice(0, 8).map((h: any) => str(h, 40)) : [],
      meilleur_moment: str(p.meilleur_moment, 100),
      duree_conseillee: str(p.duree_conseillee, 60),
      astuce_pro: str(p.astuce_pro, 300),
    };
  } catch {
    return null;
  }
};

export const checkTrendVideo = async (
  filePath: string,
  mimeType: string,
  plan: RemixPlan,
  trendDescription?: string,
  card?: CreatorCard | null
): Promise<TrendCheckResult> => {
  const planText = [
    `Titre : ${plan.titre}`,
    `Concept : ${plan.concept}`,
    `Accroche : texte à l'écran « ${plan.accroche.texte_ecran} », ouverture « ${plan.accroche.phrase} »`,
    'Étapes :',
    ...plan.plans.map((s, i) => `${i + 1}. [${s.moment}] ${s.action}${s.texte_ecran ? ` (texte : « ${s.texte_ecran} »)` : ''}`),
    `Son : ${plan.son.titre} — ${plan.son.conseil}`,
    `Durée conseillée : ${plan.duree_conseillee}`,
  ].join('\n');

  const prompt = `Tu es un coach TikTok francophone, exigeant mais bienveillant. Un créateur a tourné cette vidéo en suivant un plan
pour reprendre une tendance. Regarde la vidéo attentivement et compare-la au plan.

${trendDescription ? `TENDANCE D'ORIGINE\n${trendDescription}\n\n` : ''}PLAN QU'IL DEVAIT SUIVRE
${planText}
${cardPromptBlock(card)}
Règles :
- Sois précis et concret : cite des moments de la vidéo (ex. « à 0:03 »), ce que tu vois et entends réellement.
- Le créateur peut s'écarter du plan si c'est une bonne idée : valorise-le dans "touche_perso".
- L'accroche (2 premières secondes) compte le plus : sois strict dessus.
- Le son tendance s'ajoute souvent dans TikTok après coup : si la vidéo n'a pas encore le son, ne pénalise pas, rappelle-le simplement.
- Tutoiement, français simple, sans jargon. Phrases courtes.
- score = à quel point la vidéo est prête à cartonner sur cette tendance (0 à 100, réaliste).
- pret_a_publier = true seulement s'il n'y a plus de correction importante.

Réponds UNIQUEMENT en JSON :
{
  "score": 0,
  "pret_a_publier": false,
  "verdict": "1 à 2 phrases : où il en est et la priorité n°1",
  "accroche": { "statut": "ok" | "a_corriger", "constat": "ce que tu vois dans les 2 premières secondes", "conseil": "comment l'améliorer (ou pourquoi elle marche)" },
  "etapes": [ { "moment": "repris du plan", "attendu": "résumé de l'étape du plan", "statut": "ok" | "partiel" | "manquant", "commentaire": "ce qui est fait ou manque" } ],
  "corrections": [ { "moment": "0:03", "probleme": "...", "solution": "action concrète" } ],
  "points_forts": ["2 à 3 points forts"],
  "touche_perso": "ce qu'il a ajouté de personnel et qui marche (ou une idée pour se démarquer)"
}
Une entrée dans "etapes" par étape du plan, dans l'ordre. "corrections" : 0 à 4, la plus importante en premier.`;

  const video = await prepareVideo(filePath, mimeType);
  let result: any;
  try {
    result = await getModel().generateContent({
      contents: [{ role: 'user', parts: [video.part, { text: prompt }] }],
    });
  } finally {
    video.cleanup();
  }
  const text = result.response.text();
  const raw: any = JSON.parse(text.replace(/^```json\s*|```$/g, '').trim());
  if (!raw || typeof raw !== 'object') throw new Error('Réponse vide');

  const statut = (v: unknown) => (v === 'ok' || v === 'partiel' || v === 'manquant' ? v : 'partiel');
  return {
    score: clamp(raw.score),
    pret_a_publier: raw.pret_a_publier === true,
    verdict: str(raw.verdict, 400),
    accroche: {
      statut: raw.accroche?.statut === 'ok' ? 'ok' : 'a_corriger',
      constat: str(raw.accroche?.constat),
      conseil: str(raw.accroche?.conseil),
    },
    etapes: (Array.isArray(raw.etapes) ? raw.etapes : []).slice(0, 8).map((e: any) => ({
      moment: str(e?.moment, 30), attendu: str(e?.attendu, 200), statut: statut(e?.statut), commentaire: str(e?.commentaire, 300),
    })),
    corrections: (Array.isArray(raw.corrections) ? raw.corrections : []).slice(0, 4).map((c: any) => ({
      moment: str(c?.moment, 20), probleme: str(c?.probleme, 250), solution: str(c?.solution, 300),
    })),
    points_forts: (Array.isArray(raw.points_forts) ? raw.points_forts : []).slice(0, 3).map((p: any) => str(p, 200)),
    touche_perso: str(raw.touche_perso),
  };
};

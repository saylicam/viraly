import type { CreatorProfile } from './creatorProfile';
import { NICHE_LABELS } from './creatorProfile';

/**
 * Plan de départ construit à partir des réponses du questionnaire.
 * Contenu rédigé à la main (pas d'IA) : instantané, gratuit et toujours cohérent.
 */

export interface PlanTip {
  tag: string;      // « Priorité n°1 », « Ta niche »…
  icon: string;     // nom Ionicons
  color: string;
  title: string;
  text: string;
}

export interface PlanSlot { day: string; hour: string }

export interface CreatorPlan {
  headline: string;
  intro: string;
  tips: PlanTip[];
  perWeek: number;
  slots: PlanSlot[];
}

const BLOCKER_TIPS: Record<string, Omit<PlanTip, 'tag' | 'color'>> = {
  ideas: { icon: 'bulb-outline', title: 'Plus jamais à court d’idées', text: 'Chaque semaine, l’onglet Tendances te montre ce qui explose dans ta niche. Choisis-en une, appuie sur « Refaire à ma façon » : ton plan de tournage est prêt en 10 secondes.' },
  hook: { icon: 'flash-outline', title: 'Gagne les 2 premières secondes', text: 'Commence par le résultat, une question ou une phrase choc, avec un texte à l’écran. Avant de publier, Viraly vérifie ton accroche.' },
  consistency: { icon: 'repeat-outline', title: 'Un rythme simple et tenable', text: 'Ton calendrier est déjà rempli avec tes créneaux. Prépare 2 vidéos d’avance le week-end pour ne jamais rater un jour.' },
  editing: { icon: 'cut-outline', title: 'Moins de temps au montage', text: 'Filme plan par plan en suivant ton plan de tournage : moins de rushs, moins de montage. Vise 15 à 25 secondes.' },
  algorithm: { icon: 'help-circle-outline', title: 'Comprends ce qui marche', text: 'TikTok regarde surtout si les gens restent jusqu’au bout. Chaque analyse te montre où ils risquent de partir, et comment l’éviter.' },
};

const NICHE_TIPS: Record<string, Omit<PlanTip, 'tag' | 'color' | 'icon'>> = {
  comedy: { title: 'Des sketchs courts avec une chute nette', text: 'Les situations du quotidien en moins de 20 secondes marchent le mieux. Détourne les sons tendance à ta façon.' },
  music: { title: 'Montre les coulisses', text: 'Extraits de 15 secondes, avant/après, reprises de sons tendance : ton public veut voir comment tu crées.' },
  beauty: { title: 'Le résultat dès la première seconde', text: 'Montre le look final d’abord, puis explique. Les tutos rapides et les tests produits cartonnent.' },
  education: { title: 'Une astuce, une vidéo', text: 'Annonce le bénéfice dès la première phrase (« 3 raccourcis que personne ne connaît »). Sous-titres indispensables.' },
  gaming: { title: 'Le moment fort en premier', text: 'Ouvre sur l’action la plus folle, puis le contexte. Les clips de 20 à 30 secondes avec ta réaction marchent le mieux.' },
  fitness: { title: 'Montre la transformation', text: 'Avant/après, routines de 30 secondes et erreurs à éviter. Filme de face, avec une bonne lumière.' },
  tech: { title: 'Le problème, puis la solution', text: '« Ton téléphone fait ça ? Voilà comment le régler. » Va droit au but et montre l’écran en gros plan.' },
  food: { title: 'Le plat fini en premier', text: 'Ouvre sur le résultat appétissant, puis la recette en accéléré. Le son de la cuisson aide beaucoup.' },
  travel: { title: 'Fais rêver en 2 secondes', text: 'Ouvre sur ton plus beau plan et ajoute une info utile (prix, lieu, astuce). Les « 3 spots secrets » marchent très bien.' },
};

const GOAL_TIPS: Record<string, Omit<PlanTip, 'tag' | 'color'>> = {
  views: { icon: 'eye-outline', title: 'Surfe sur les sons qui montent', text: 'Choisis un son « Émergent » dans l’onglet Tendances : il reste de la place pour être vu avant tout le monde.' },
  engagement: { icon: 'chatbubbles-outline', title: 'Fais réagir à la fin', text: 'Termine par une question ou un choix (« team A ou team B ? ») et réponds aux commentaires dans la première heure.' },
  fanbase: { icon: 'people-outline', title: 'Crée un rendez-vous', text: 'Une série avec le même format (« Jour 1, Jour 2… ») donne envie de s’abonner pour voir la suite.' },
  monetization: { icon: 'cash-outline', title: 'Une niche claire, une audience fidèle', text: 'Les marques cherchent un thème précis et des abonnés qui reviennent. Garde un sujet principal et soigne tes légendes.' },
};

const LEVEL_INTRO: Record<string, string> = {
  beginner: 'On commence simple : une tendance par semaine, bien exécutée.',
  intermediate: 'Tu as les bases : on va rendre tes vidéos plus accrocheuses.',
  advanced: 'Tu es lancé·e : on optimise chaque détail pour passer un cap.',
  pro: 'On t’aide à garder une longueur d’avance sur les tendances.',
};

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
/** Mêmes créneaux que ceux ajoutés au calendrier (calendarService). */
const DAYS_BY_COUNT: Record<number, number[]> = { 1: [3], 2: [2, 5], 3: [1, 3, 5], 5: [1, 2, 3, 4, 5] };
const PER_WEEK: Record<string, number> = { '1week': 1, '2week': 3, daily: 5, irregular: 2 };
const HOURS = ['19:00', '18:30', '20:00'];

export const buildCreatorPlan = (p: CreatorProfile): CreatorPlan => {
  const niche = p.niches?.[0];
  const nicheLabel = niche ? NICHE_LABELS[niche] ?? niche : 'ta niche';
  const tips: PlanTip[] = [];

  const blocker = BLOCKER_TIPS[p.blocker ?? ''] ?? BLOCKER_TIPS.ideas;
  tips.push({ tag: 'Priorité n°1', color: '#FF4FF9', ...blocker });

  const nicheTip = NICHE_TIPS[niche ?? ''];
  if (nicheTip) tips.push({ tag: nicheLabel, color: '#4FC3FF', icon: 'videocam-outline', ...nicheTip });

  const goal = GOAL_TIPS[p.goal ?? ''] ?? GOAL_TIPS.views;
  tips.push({ tag: 'Ton objectif', color: '#FFD84F', ...goal });

  const perWeek = PER_WEEK[p.frequency ?? ''] ?? 1;
  const slots = (DAYS_BY_COUNT[perWeek] ?? [3]).map((d, i) => ({ day: DAY_NAMES[d], hour: HOURS[i % HOURS.length].replace(':', 'h') }));

  return {
    headline: niche ? `Ton plan ${nicheLabel}` : 'Ton plan de départ',
    intro: LEVEL_INTRO[p.level ?? ''] ?? LEVEL_INTRO.beginner,
    tips,
    perWeek,
    slots,
  };
};

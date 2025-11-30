import { PremiumAnalysisResult } from '../types';

/**
 * Données mockées pour tester l'affichage de l'analyse premium
 */
export const mockPremiumAnalysis: PremiumAnalysisResult = {
  summary: {
    score: 82,
    retention: 75,
    hook_strength: 88,
    clarity: 80,
    shareability: 78,
    category: 'Gym Humor',
    format: 'Facecam',
    verdict: '✨ Excellent',
  },
  timeline: [
    {
      timestamp: '00:00',
      label: 'Hook initial',
      detail: 'Question directe captivante qui accroche immédiatement l\'attention. Le créateur pose une question relatable dès la première seconde.',
      impact: '+10',
    },
    {
      timestamp: '00:03',
      label: 'Transition',
      detail: 'Transition fluide vers le contenu principal. Le rythme s\'accélère légèrement pour maintenir l\'engagement.',
      impact: '+5',
    },
    {
      timestamp: '00:08',
      label: 'Point culminant',
      detail: 'Moment clé de la vidéo où le message principal est délivré. L\'humour fonctionne bien ici.',
      impact: '+10',
    },
    {
      timestamp: '00:15',
      label: 'Milieu de vidéo',
      detail: 'Risque de désengagement si le contenu ralentit. Heureusement, le rythme reste soutenu.',
      impact: '0',
    },
    {
      timestamp: '00:22',
      label: 'Conclusion',
      detail: 'Call-to-action efficace qui encourage l\'engagement. La vidéo se termine sur une note positive.',
      impact: '+5',
    },
  ],
  critical_moments: [
    {
      timestamp: '00:00',
      reason: 'Les 3 premières secondes déterminent si l\'utilisateur va continuer à regarder. C\'est ici que le hook doit être parfait.',
      importance: 10,
    },
    {
      timestamp: '00:08',
      reason: 'Point culminant de la vidéo. Si ce moment ne fonctionne pas, la vidéo perdra en engagement.',
      importance: 9,
    },
    {
      timestamp: '00:15',
      reason: 'Zone de risque de désengagement. Beaucoup d\'utilisateurs quittent à ce moment si le contenu ralentit.',
      importance: 8,
    },
  ],
  strengths: [
    'Hook captivant dès la première seconde avec question directe',
    'Rythme des cuts parfaitement synchronisé avec la musique',
    'Authenticité du créateur qui crée une connexion avec le public',
    'Humour efficace qui fonctionne bien avec la cible',
    'Qualité audio et vidéo professionnelle',
  ],
  weaknesses: [
    'Manque de sous-titres pour les 10 premières secondes',
    'Transition trop longue entre 00:15 et 00:18',
    'Pas de call-to-action clair avant la fin',
    'Musique légèrement trop forte par moments',
  ],
  risks: [
    'Risque de swipe à 00:08 si le hook n\'accroche pas immédiatement',
    'Milieu de vidéo (00:20-00:25) peut perdre l\'attention si le rythme ralentit',
    'Absence de sous-titres peut réduire l\'accessibilité',
  ],
  recommendations: [
    {
      id: 1,
      text: 'Ajouter des sous-titres animés pour les 5 premières secondes pour améliorer l\'accessibilité',
      impact: 'fort',
    },
    {
      id: 2,
      text: 'Accélérer la transition entre 00:15 et 00:18 pour maintenir le rythme',
      impact: 'moyen',
    },
    {
      id: 3,
      text: 'Ajouter un call-to-action clair à 00:20 pour encourager l\'engagement',
      impact: 'fort',
    },
    {
      id: 4,
      text: 'Réduire légèrement le volume de la musique pour améliorer la clarté vocale',
      impact: 'faible',
    },
    {
      id: 5,
      text: 'Ajouter des effets visuels subtils aux moments clés pour renforcer l\'impact',
      impact: 'moyen',
    },
  ],
  emotions_detected: ['joie', 'amusement', 'relatable', 'motivation'],
  public_target: 'Jeunes adultes 18-25 ans intéressés par le fitness et l\'humour',
  hashtags: [
    '#GymFail',
    '#MuscuDrôle',
    '#FitnessFrance',
    '#GymHumor',
    '#Relatable',
    '#FitnessMotivation',
    '#GymLife',
    '#WorkoutFun',
    '#FitnessContent',
    '#GymTok',
  ],
  trends: [
    'POV Gym',
    'Fitness Humor',
    'Relatable Content',
    'Gym Fails',
  ],
  next_video_ideas: [
    'Créer une série "POV Gym" avec différents scénarios humoristiques',
    'Faire une vidéo "Day in the Life" d\'un passionné de fitness',
    'Créer du contenu éducatif avec une touche d\'humour sur les erreurs courantes en salle',
  ],
};



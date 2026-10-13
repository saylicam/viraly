import { CalendarTask } from '../../services/calendarService';

/** Apparence commune des 3 types de tâches (calendrier, accueil, ajout). */
export const TASK_TYPES: Record<CalendarTask['type'], { label: string; short: string; icon: string; color: string }> = {
  publish: { label: 'Publication', short: 'Publier', icon: 'rocket-outline', color: '#FF4FF9' },
  record: { label: 'Tournage', short: 'Tourner', icon: 'videocam-outline', color: '#4FC3FF' },
  idea: { label: 'Idée', short: 'Idée', icon: 'bulb-outline', color: '#FFB84F' },
};

export const typeMeta = (type?: string) => TASK_TYPES[(type as CalendarTask['type']) ?? 'publish'] ?? TASK_TYPES.publish;

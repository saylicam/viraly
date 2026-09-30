/**
 * Utilitaires de dates en HEURE LOCALE.
 *
 * Ne JAMAIS utiliser `toISOString().split('T')[0]` pour obtenir une date du jour :
 * toISOString() convertit en UTC, et en Belgique (UTC+1/+2) minuit local
 * correspond à la veille en UTC -> les tâches se retrouvaient sur le mauvais jour.
 */

/** Retourne la date locale au format YYYY-MM-DD */
export const toLocalDateString = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Vérifie le format YYYY-MM-DD et que la date existe réellement */
export const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

/** Vérifie le format HH:MM (00:00 -> 23:59) */
export const isValidHourString = (value: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

import { collection, doc, setDoc, getDocs, deleteDoc } from './firestoreWrapper';
import { db } from '../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toLocalDateString } from '../utils/date';

/**
 * Type pour une tâche du calendrier
 */
export interface CalendarTask {
  id: string;
  date: string; // Format: "2025-12-01" (date locale)
  hour: string; // Format: "19:00"
  type: 'publish' | 'record' | 'idea';
  title: string;
  createdBy: 'ai' | 'user';
  createdAt?: string;
  notes?: string; // détails (ex. plan de tournage d'une tendance)
  done?: boolean; // cochée par le créateur (publiée, tournée…)
}

/**
 * Stockage :
 * - Utilisateur connecté -> Firestore uniquement : users/{uid}/calendar/{taskId}
 * - Invité               -> AsyncStorage uniquement (sur le téléphone)
 *
 * Avant, les deux étaient mélangés (double stockage en dev) et les erreurs Firestore
 * étaient avalées : une tâche pouvait sembler enregistrée alors qu'elle était perdue.
 * Maintenant, une erreur remonte à l'écran pour prévenir l'utilisateur.
 */

const GUEST_UID_KEY = '@viraly_guest_uid';

const isGuestId = (userId: string | null | undefined) => !userId || userId === 'guest';

const getGuestStorageKey = async (): Promise<string> => {
  let guestUid: string | null = null;
  try {
    guestUid = await AsyncStorage.getItem(GUEST_UID_KEY);
    if (!guestUid) {
      guestUid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      await AsyncStorage.setItem(GUEST_UID_KEY, guestUid);
    }
  } catch {
    guestUid = 'guest_local';
  }
  return `@viraly_calendar_${guestUid}`;
};

const readGuestTasks = async (): Promise<CalendarTask[]> => {
  const key = await getGuestStorageKey();
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as CalendarTask[]) : [];
};

const writeGuestTasks = async (tasks: CalendarTask[]): Promise<void> => {
  const key = await getGuestStorageKey();
  await AsyncStorage.setItem(key, JSON.stringify(tasks));
};

const calendarCollection = (userId: string) => collection(db as any, 'users', userId, 'calendar');

const NICHE_NAMES: Record<string, string> = {
  comedy: 'Comédie', music: 'Musique', beauty: 'Beauté', education: 'Éducation', gaming: 'Gaming',
  fitness: 'Fitness', tech: 'Tech', food: 'Cuisine', travel: 'Voyages',
};

const sortTasks = (tasks: CalendarTask[]) =>
  tasks.sort((a, b) => a.date.localeCompare(b.date) || a.hour.localeCompare(b.hour));

/**
 * Sauvegarder une tâche. Lève une erreur si l'enregistrement échoue.
 */
export const saveTask = async (
  task: Omit<CalendarTask, 'id' | 'createdAt'>,
  userId: string | null = null
): Promise<string> => {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const taskData: CalendarTask = { ...task, id: taskId, createdAt: new Date().toISOString() };

  if (isGuestId(userId)) {
    const tasks = await readGuestTasks();
    tasks.push(taskData);
    await writeGuestTasks(tasks);
    return taskId;
  }

  await setDoc(doc(calendarCollection(userId as string), taskId), taskData);
  return taskId;
};

/**
 * Récupérer toutes les tâches d'un utilisateur (triées par date puis heure).
 * Lève une erreur si la lecture échoue.
 */
export const getTasks = async (userId: string | null = null): Promise<CalendarTask[]> => {
  if (isGuestId(userId)) {
    return sortTasks(await readGuestTasks());
  }

  const snapshot = await getDocs(calendarCollection(userId as string));
  const tasks: CalendarTask[] = [];
  snapshot.forEach((d: any) => tasks.push(d.data() as CalendarTask));
  return sortTasks(tasks);
};

/**
 * Récupérer les tâches pour une date (YYYY-MM-DD).
 */
export const getTasksByDate = async (date: string, userId: string | null = null): Promise<CalendarTask[]> => {
  const allTasks = await getTasks(userId);
  return allTasks.filter((task) => task.date === date);
};

/**
 * Modifier une tâche (ex. la cocher). Lève une erreur si l'enregistrement échoue.
 */
export const updateTask = async (
  taskId: string,
  patch: Partial<Omit<CalendarTask, 'id'>>,
  userId: string | null = null
): Promise<void> => {
  if (isGuestId(userId)) {
    const tasks = await readGuestTasks();
    await writeGuestTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    return;
  }
  await setDoc(doc(calendarCollection(userId as string), taskId), patch, { merge: true });
};

/**
 * Supprimer une tâche. Lève une erreur si la suppression échoue.
 */
export const deleteTask = async (taskId: string, userId: string | null = null): Promise<void> => {
  if (isGuestId(userId)) {
    const tasks = await readGuestTasks();
    await writeGuestTasks(tasks.filter((t) => t.id !== taskId));
    return;
  }

  await deleteDoc(doc(calendarCollection(userId as string), taskId));
};

/**
 * Générer automatiquement des tâches à partir des réponses du questionnaire
 * (4 semaines, uniquement des dates à venir).
 */
/**
 * Quand le créateur change de niche : met à jour le titre des publications futures créées par l'IA
 * (« Publier une vidéo Comédie » → « Publier une vidéo Musique »). Les tâches écrites par l'utilisateur ne bougent pas.
 */
export const renameAiPublishTasks = async (niche: string | undefined, userId: string | null = null): Promise<number> => {
  const label = niche ? NICHE_NAMES[niche] ?? niche : '';
  const title = label ? `Publier une vidéo ${label}` : 'Publier une vidéo';
  const today = toLocalDateString();
  const isAiPublish = (t: CalendarTask) =>
    t.createdBy === 'ai' && t.type === 'publish' && t.date >= today && t.title.startsWith('Publier une vidéo') && t.title !== title;

  if (isGuestId(userId)) {
    const tasks = await readGuestTasks();
    let n = 0;
    tasks.forEach((t) => { if (isAiPublish(t)) { t.title = title; n++; } });
    if (n) await writeGuestTasks(tasks);
    return n;
  }
  const tasks = await getTasks(userId);
  const targets = tasks.filter(isAiPublish);
  await Promise.all(targets.map((t) => setDoc(doc(calendarCollection(userId as string), t.id), { title }, { merge: true })));
  return targets.length;
};

export const generateTasksFromQuestionnaire = async (
  answers: Record<string, string[]>,
  userId: string | null = null
): Promise<number> => {
  const frequency = answers.frequency?.[0] || '1week';
  const niche = answers.niches?.[0];
  const nicheLabel = niche ? NICHE_NAMES[niche] ?? niche : '';

  // Jours conseillés (0 = dimanche) selon le rythme choisi
  const perWeek = ({ '1week': 1, '2week': 3, daily: 5, irregular: 2 } as Record<string, number>)[frequency] ?? 1;
  const daysByCount: Record<number, number[]> = {
    1: [3],             // mercredi
    2: [2, 5],          // mardi, vendredi
    3: [1, 3, 5],       // lundi, mercredi, vendredi
    5: [1, 2, 3, 4, 5], // du lundi au vendredi
  };
  const days = daysByCount[perWeek] ?? [3];
  const hours = ['19:00', '18:30', '20:00'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let created = 0;

  // Première mission : choisir une tendance (demain)
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  await saveTask({
    date: toLocalDateString(tomorrow),
    hour: '18:00',
    type: 'idea',
    title: 'Choisir une tendance de la semaine',
    createdBy: 'ai',
    notes: 'Onglet Tendances → « Refaire à ma façon » pour obtenir ton plan de tournage.',
  }, userId);
  created++;

  // Créneaux de publication sur 2 semaines
  for (let week = 0; week < 2; week++) {
    for (const [i, dayOfWeek] of days.entries()) {
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + week * 7 + (dayOfWeek - today.getDay()));
      if (taskDate <= today) continue; // pas de tâches dans le passé
      await saveTask({
        date: toLocalDateString(taskDate),
        hour: hours[i % hours.length],
        type: 'publish',
        title: nicheLabel ? `Publier une vidéo ${nicheLabel}` : 'Publier une vidéo',
        createdBy: 'ai',
      }, userId);
      created++;
    }
  }
  return created;
};

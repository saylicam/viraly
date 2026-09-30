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
export const generateTasksFromQuestionnaire = async (
  answers: Record<string, string[]>,
  userId: string | null = null
): Promise<void> => {
  const frequency = answers.frequency?.[0] || '1x / semaine';
  const niches = answers.niches || [];

  let tasksPerWeek = 1;
  if (frequency.includes('2x') || frequency.includes('2 fois')) tasksPerWeek = 2;
  else if (frequency.includes('3x') || frequency.includes('3 fois')) tasksPerWeek = 3;
  else if (frequency.includes('quotidien') || frequency.includes('tous les jours')) tasksPerWeek = 7;

  const daysByFrequency: Record<number, number[]> = {
    1: [3],                   // Mercredi
    2: [1, 3],                // Lundi, Mercredi
    3: [1, 3, 5],             // Lundi, Mercredi, Vendredi
    7: [0, 1, 2, 3, 4, 5, 6], // Tous les jours
  };
  const daysOfWeek = daysByFrequency[tasksPerWeek];
  const bestHours = ['19:00', '18:00', '20:00', '21:00'];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let week = 0; week < 4; week++) {
    for (const dayOfWeek of daysOfWeek) {
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + week * 7 + (dayOfWeek - today.getDay()));
      if (taskDate < today) continue; // pas de tâches dans le passé

      await saveTask(
        {
          date: toLocalDateString(taskDate),
          hour: bestHours[Math.floor(Math.random() * bestHours.length)],
          type: 'publish',
          title: `Publication ${niches[0] || 'contenu'}`,
          createdBy: 'ai',
        },
        userId
      );
    }
  }
};

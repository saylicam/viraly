import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy } from '../services/firestoreWrapper';
import { db } from '../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Type pour une tâche du calendrier
 */
export interface CalendarTask {
  id: string;
  date: string; // Format: "2025-12-01"
  hour: string; // Format: "19:00"
  type: 'publish' | 'record' | 'idea';
  title: string;
  createdBy: 'ai' | 'user';
  createdAt?: string;
}

/**
 * Clé AsyncStorage pour l'UID invité
 */
const GUEST_UID_KEY = '@viraly_guest_uid';

/**
 * Obtenir l'UID de l'utilisateur (Firebase ou invité)
 * @param userId - UID Firebase de l'utilisateur (peut être null pour invité)
 */
const getUserId = async (userId: string | null): Promise<string> => {
  // Si utilisateur Firebase connecté
  if (userId && userId !== 'guest') {
    return userId;
  }
  
  // Mode invité : utiliser ou créer un UID local
  try {
    let guestUid = await AsyncStorage.getItem(GUEST_UID_KEY);
    if (!guestUid) {
      guestUid = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(GUEST_UID_KEY, guestUid);
    }
    return guestUid;
  } catch (error) {
    // Fallback si AsyncStorage échoue
    return `guest_${Date.now()}`;
  }
};

/**
 * Obtenir le chemin Firestore pour les tâches d'un utilisateur
 */
const getCalendarPath = (userId: string) => {
  return `users/${userId}/calendar`;
};

/**
 * Sauvegarder une tâche dans Firestore
 * @param task - Tâche à sauvegarder
 * @param userId - UID de l'utilisateur (null pour invité)
 */
export const saveTask = async (task: Omit<CalendarTask, 'id' | 'createdAt'>, userId: string | null = null): Promise<string> => {
  const finalUserId = await getUserId(userId);
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const taskData: CalendarTask = {
    ...task,
    id: taskId,
    createdAt: new Date().toISOString(),
  };

  // En mode dev (__DEV__), Firestore est mocké, donc on stocke aussi en local
  if (__DEV__ || finalUserId.startsWith('guest_')) {
    try {
      const localTasks = await AsyncStorage.getItem(`@viraly_calendar_${finalUserId}`);
      const tasks = localTasks ? JSON.parse(localTasks) : [];
      tasks.push(taskData);
      await AsyncStorage.setItem(`@viraly_calendar_${finalUserId}`, JSON.stringify(tasks));
    } catch (error) {
      console.warn('Erreur sauvegarde locale:', error);
    }
  }

  // Sauvegarder dans Firestore (sera mocké en mode dev)
  try {
    const calendarPath = getCalendarPath(finalUserId);
    await setDoc(doc(db as any, calendarPath, taskId), taskData);
    return taskId;
  } catch (error) {
    console.warn('Erreur sauvegarde Firestore:', error);
    // En cas d'erreur, retourner l'ID quand même (sauvegarde locale réussie)
    return taskId;
  }
};

/**
 * Récupérer toutes les tâches d'un utilisateur
 * @param userId - UID de l'utilisateur (null pour invité)
 */
export const getTasks = async (userId: string | null = null): Promise<CalendarTask[]> => {
  const finalUserId = await getUserId(userId);
  
  // En mode dev ou invité, lire depuis AsyncStorage
  if (__DEV__ || finalUserId.startsWith('guest_')) {
    try {
      const localTasks = await AsyncStorage.getItem(`@viraly_calendar_${finalUserId}`);
      if (localTasks) {
        const tasks = JSON.parse(localTasks);
        // Trier par date puis heure
        return tasks.sort((a: CalendarTask, b: CalendarTask) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.hour.localeCompare(b.hour);
        });
      }
    } catch (error) {
      console.warn('Erreur lecture locale:', error);
    }
  }

  // Lire depuis Firestore
  try {
    const calendarPath = getCalendarPath(finalUserId);
    const calendarRef = collection(db as any, calendarPath);
    const snapshot = await getDocs(calendarRef);
    
    const tasks: CalendarTask[] = [];
    snapshot.forEach((doc) => {
      tasks.push(doc.data() as CalendarTask);
    });
    
    // Trier par date puis heure
    return tasks.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.hour.localeCompare(b.hour);
    });
  } catch (error) {
    console.warn('Erreur lecture Firestore:', error);
    return [];
  }
};

/**
 * Récupérer les tâches pour une date spécifique
 * @param date - Date au format YYYY-MM-DD
 * @param userId - UID de l'utilisateur (null pour invité)
 */
export const getTasksByDate = async (date: string, userId: string | null = null): Promise<CalendarTask[]> => {
  const allTasks = await getTasks(userId);
  return allTasks.filter(task => task.date === date);
};

/**
 * Supprimer une tâche
 * @param taskId - ID de la tâche à supprimer
 * @param userId - UID de l'utilisateur (null pour invité)
 */
export const deleteTask = async (taskId: string, userId: string | null = null): Promise<void> => {
  const finalUserId = await getUserId(userId);
  
  // Supprimer de la sauvegarde locale
  if (__DEV__ || finalUserId.startsWith('guest_')) {
    try {
      const localTasks = await AsyncStorage.getItem(`@viraly_calendar_${finalUserId}`);
      if (localTasks) {
        const tasks: CalendarTask[] = JSON.parse(localTasks);
        const filtered = tasks.filter(t => t.id !== taskId);
        await AsyncStorage.setItem(`@viraly_calendar_${finalUserId}`, JSON.stringify(filtered));
      }
    } catch (error) {
      console.warn('Erreur suppression locale:', error);
    }
  }

  // Supprimer de Firestore
  try {
    const calendarPath = getCalendarPath(finalUserId);
    await deleteDoc(doc(db as any, calendarPath, taskId));
  } catch (error) {
    console.warn('Erreur suppression Firestore:', error);
  }
};

/**
 * Générer automatiquement des tâches basées sur les réponses du questionnaire
 * @param answers - Réponses du questionnaire
 * @param userId - UID de l'utilisateur (null pour invité)
 */
export const generateTasksFromQuestionnaire = async (
  answers: Record<string, string[]>,
  userId: string | null = null
): Promise<void> => {
  const finalUserId = await getUserId(userId);
  
  // Extraire les informations du questionnaire
  const frequency = answers.frequency?.[0] || '1x / semaine';
  const goal = answers.goal?.[0] || 'Augmenter mes vues';
  const niches = answers.niches || [];
  
  // Déterminer le nombre de tâches par semaine
  let tasksPerWeek = 1;
  if (frequency.includes('2x') || frequency.includes('2 fois')) {
    tasksPerWeek = 2;
  } else if (frequency.includes('3x') || frequency.includes('3 fois')) {
    tasksPerWeek = 3;
  } else if (frequency.includes('quotidien') || frequency.includes('tous les jours')) {
    tasksPerWeek = 7;
  }
  
  // Meilleurs horaires selon les objectifs
  const bestHours = ['19:00', '18:00', '20:00', '21:00'];
  
  // Générer les tâches pour les 4 prochaines semaines
  const tasks: Omit<CalendarTask, 'id' | 'createdAt'>[] = [];
  const today = new Date();
  
  for (let week = 0; week < 4; week++) {
    // Distribuer les tâches sur la semaine
    const daysOfWeek = [1, 3, 5]; // Lundi, Mercredi, Vendredi par défaut
    if (tasksPerWeek === 2) {
      daysOfWeek.splice(2, 1); // Lundi, Mercredi
    } else if (tasksPerWeek === 3) {
      // Lundi, Mercredi, Vendredi
    } else if (tasksPerWeek === 7) {
      daysOfWeek.push(0, 2, 4, 6); // Tous les jours
    }
    
    for (let i = 0; i < tasksPerWeek && i < daysOfWeek.length; i++) {
      const dayOfWeek = daysOfWeek[i];
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + (week * 7) + (dayOfWeek - today.getDay()));
      
      // Formater la date en YYYY-MM-DD
      const dateStr = taskDate.toISOString().split('T')[0];
      
      // Choisir un horaire aléatoire parmi les meilleurs
      const hour = bestHours[Math.floor(Math.random() * bestHours.length)];
      
      tasks.push({
        date: dateStr,
        hour: hour,
        type: 'publish',
        title: `Publication ${niches[0] || 'contenu'}`,
        createdBy: 'ai',
      });
    }
  }
  
  // Sauvegarder toutes les tâches
  for (const task of tasks) {
    await saveTask(task, userId);
  }
};


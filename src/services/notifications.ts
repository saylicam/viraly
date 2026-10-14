import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import type { CalendarTask } from './calendarService';

/**
 * Notifications de Viraly.
 *  1. Tendances (envoyées par le serveur, 3 fois par semaine, à TOUS les comptes qui les acceptent,
 *     gratuits compris) : jeton Expo enregistré dans users/{uid}.expoPushToken.
 *  2. Rappels du calendrier (programmés sur le téléphone, sans serveur) : 30 min avant chaque tâche.
 *  3. Relance (sur le téléphone) : si l'app n'est pas ouverte pendant 3 jours.
 *
 * expo-notifications est chargé à la demande : une version de l'app compilée sans ce module
 * natif continue de fonctionner, simplement sans notifications.
 */
type NotificationsModule = any;
let Notifications: NotificationsModule | null = null;
try {
  Notifications = require('expo-notifications');
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  Notifications = null;
}

export type NotificationResult = 'granted' | 'denied' | 'error' | 'unavailable';

export const notificationsAvailable = () => Notifications != null;

/** Vrai si l'utilisateur a déjà accepté les notifications. */
export const notificationsGranted = async () => {
  if (!Notifications) return true; // module absent : on n'affiche pas la proposition
  return (await Notifications.getPermissionsAsync()).status === 'granted';
};

/** Enregistre le jeton du téléphone dans le compte (pour les notifications du serveur). */
const saveToken = async () => {
  const user = auth.currentUser;
  if (!Notifications || !user) return false;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await setDoc(
    doc(db, 'users', user.uid),
    { expoPushToken: token, notificationsEnabled: true, notificationsUpdatedAt: new Date().toISOString() },
    { merge: true }
  );
  return true;
};

/**
 * Demande l'autorisation (fenêtre d'Apple), puis enregistre le jeton.
 * Utilisé pour TOUTES les notifications (tendances + rappels).
 */
export const enableTrendNotifications = async (): Promise<NotificationResult> => {
  if (!Notifications) return 'unavailable';
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return 'denied';
    await saveToken();
    return 'granted';
  } catch (error) {
    console.warn('Notifications indisponibles:', error);
    return 'error';
  }
};
export const enableNotifications = enableTrendNotifications;

/** À chaque ouverture : jeton à jour (il peut changer après une réinstallation). */
export const refreshPushToken = async () => {
  try {
    if (Notifications && (await Notifications.getPermissionsAsync()).status === 'granted') await saveToken();
  } catch {}
};

// ---------- Proposition d'activer les notifications ----------

const ASKED_KEY = '@viraly_notif_asked_at';
const ASK_AGAIN_DAYS = 3;

/** Faut-il proposer d'activer les notifications ? (pas encore accepté, pas demandé récemment) */
export const shouldPromptNotifications = async () => {
  if (!Notifications) return false;
  try {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return false;
    const last = Number((await AsyncStorage.getItem(ASKED_KEY)) ?? 0);
    if (Date.now() - last < ASK_AGAIN_DAYS * 864e5) return false;
    // Refusé dans la fenêtre d'Apple : on ne peut plus que renvoyer vers les Réglages
    return canAskAgain !== false || Date.now() - last > 14 * 864e5;
  } catch {
    return false;
  }
};
export const markNotificationsPrompted = () => AsyncStorage.setItem(ASKED_KEY, String(Date.now())).catch(() => {});

// ---------- Rappels du calendrier (programmés sur le téléphone) ----------

const TASK_KIND = 'task-reminder';
const REMINDER_MINUTES = 30;
const MAX_REMINDERS = 40; // iOS garde au plus 64 notifications programmées

const TASK_TEXT: Record<CalendarTask['type'], (t: CalendarTask) => { title: string; body: string }> = {
  publish: (t) => ({ title: '🚀 C’est bientôt l’heure de publier', body: `${t.title} à ${t.hour}. Passe ta vidéo dans Viraly avant de la poster.` }),
  record: (t) => ({ title: '🎬 Tournage dans 30 minutes', body: `${t.title} à ${t.hour}. Ton plan est prêt dans le calendrier.` }),
  idea: (t) => ({ title: '💡 Petit moment créatif', body: `${t.title} à ${t.hour}. Les tendances de la semaine t’attendent.` }),
};

/**
 * Reprogramme les rappels de toutes les tâches à venir (non cochées).
 * Appelé à chaque chargement du calendrier : ajout, suppression ou tâche cochée sont pris en compte.
 */
export const syncTaskReminders = async (tasks: CalendarTask[]) => {
  if (!Notifications) return;
  try {
    if ((await Notifications.getPermissionsAsync()).status !== 'granted') return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n: any) => n.content?.data?.kind === TASK_KIND)
        .map((n: any) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
    const now = Date.now();
    const upcoming = tasks
      .filter((t) => !t.done)
      .map((t) => {
        const [h, m] = t.hour.split(':').map(Number);
        const at = new Date(`${t.date}T00:00:00`);
        at.setHours(h, m, 0, 0);
        return { t, fireAt: at.getTime() - REMINDER_MINUTES * 60_000 };
      })
      .filter(({ fireAt }) => fireAt > now + 60_000)
      .sort((a, b) => a.fireAt - b.fireAt)
      .slice(0, MAX_REMINDERS);
    for (const { t, fireAt } of upcoming) {
      const text = TASK_TEXT[t.type]?.(t) ?? TASK_TEXT.publish(t);
      await Notifications.scheduleNotificationAsync({
        content: { ...text, sound: 'default', data: { kind: TASK_KIND, screen: 'Calendar', date: t.date } },
        trigger: { type: 'date', date: new Date(fireAt) },
      });
    }
  } catch (e) {
    console.warn('Rappels du calendrier non programmés:', e);
  }
};

// ---------- Relance si l'app n'est pas ouverte ----------

const COMEBACK_KIND = 'comeback';
const COMEBACK_DAYS = 3;

/** À chaque ouverture : repousse la relance à dans 3 jours (19 h). */
export const scheduleComebackReminder = async () => {
  if (!Notifications) return;
  try {
    if ((await Notifications.getPermissionsAsync()).status !== 'granted') return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n: any) => n.content?.data?.kind === COMEBACK_KIND)
        .map((n: any) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
    const at = new Date(Date.now() + COMEBACK_DAYS * 864e5);
    at.setHours(19, 0, 0, 0);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 De nouvelles tendances t’attendent',
        body: 'Des sons et des vidéos explosent dans ta niche. Jette un œil avant qu’ils soient saturés.',
        sound: 'default',
        data: { kind: COMEBACK_KIND, screen: 'Trends' },
      },
      trigger: { type: 'date', date: at },
    });
  } catch {}
};

/** Efface toutes les notifications programmées (déconnexion). */
export const cancelAllLocalNotifications = async () => {
  try { await Notifications?.cancelAllScheduledNotificationsAsync(); } catch {}
};

/** Écoute les appuis sur une notification (ex. ouvrir l'onglet Tendances ou Calendrier). */
export const onNotificationTap = (handler: (data: Record<string, any>) => void) => {
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
    handler((response.notification.request.content.data ?? {}) as Record<string, any>);
  });
  return () => sub.remove();
};

import Constants from 'expo-constants';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

/**
 * Notifications « tendances de la semaine ».
 * expo-notifications est chargé à la demande : une ancienne version de l'app (build sans ce
 * module natif) continue de fonctionner, simplement sans notifications.
 */
// ⚠️ Notifications en pause : à réactiver (npx expo install expo-notifications + plugin dans
// app.config.js + ligne ci-dessous) une fois la capacité Push activée chez Apple.
type NotificationsModule = any;
let Notifications: NotificationsModule | null = null;
try {
  // Notifications = require('expo-notifications');
  if (!Notifications) throw new Error('notifications en pause');
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

/**
 * Demande l'autorisation, récupère le jeton Expo et l'enregistre dans users/{uid}
 * pour recevoir le récap « tendances de la semaine ».
 */
export const enableTrendNotifications = async (): Promise<NotificationResult> => {
  if (!Notifications) return 'unavailable';
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return 'denied';

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const user = auth.currentUser;
    if (!user) return 'error';

    await setDoc(
      doc(db, 'users', user.uid),
      { expoPushToken: token, notificationsEnabled: true, notificationsUpdatedAt: new Date().toISOString() },
      { merge: true }
    );
    return 'granted';
  } catch (error) {
    console.warn('Notifications indisponibles:', error);
    return 'error';
  }
};

/** Écoute les appuis sur une notification (ex. ouvrir l'onglet Tendances). */
export const onNotificationTap = (handler: (data: Record<string, any>) => void) => {
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((response: any) => {
    handler((response.notification.request.content.data ?? {}) as Record<string, any>);
  });
  return () => sub.remove();
};

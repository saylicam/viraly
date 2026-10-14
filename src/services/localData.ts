import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearLocalProfile } from './creatorProfile';
import { clearAnalysisHistory } from './analysisHistory';
import { clearAccountAudit } from './accountAudit';
import { clearTrendFavorites } from '../hooks/useTrendFavorites';

/**
 * Données gardées sur le téléphone pour le compte connecté.
 * OWNER_KEY retient à quel compte elles appartiennent : si un autre compte se connecte
 * sur le même téléphone, on repart de zéro au lieu de mélanger les deux.
 */
const OWNER_KEY = '@viraly_data_owner';

export const getDataOwner = () => AsyncStorage.getItem(OWNER_KEY).catch(() => null);
export const setDataOwner = (uid: string) => AsyncStorage.setItem(OWNER_KEY, uid).catch(() => {});

/** Efface tout ce qui concerne l'utilisateur sur le téléphone (profil, historique, bilan, favoris, calendrier local). */
export const clearLocalUserData = async () => {
  await clearLocalProfile();
  clearAnalysisHistory();
  clearTrendFavorites();
  await clearAccountAudit();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const stale = keys.filter((k) =>
      k === OWNER_KEY ||
      k === '@viraly_first_launch' ||
      k === '@viraly_guest_uid' ||
      k === '@viraly_notif_off' ||
      k.startsWith('@viraly_calendar_')
    );
    if (stale.length) await AsyncStorage.multiRemove(stale);
  } catch {}
};

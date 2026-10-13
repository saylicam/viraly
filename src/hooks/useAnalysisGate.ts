import { useCallback } from 'react';
import { useRevenueCat } from '../context/RevenueCatContext';
import { apiService } from '../services/api';

/**
 * À appeler AVANT de choisir une vidéo à analyser.
 * Compte gratuit qui a déjà utilisé son analyse offerte → écran Premium tout de suite,
 * au lieu de lui faire choisir et envoyer une vidéo pour rien.
 * @returns true si l'analyse peut continuer
 */
export const useAnalysisGate = (navigation: any) => {
  const { isPremium } = useRevenueCat();
  return useCallback(async (): Promise<boolean> => {
    if (isPremium) return true;
    const res = await apiService.getQuota();
    // En cas de souci réseau, on laisse continuer : le serveur tranchera
    if (res.success && res.data && !res.data.isPremium && res.data.freeLeft === 0) {
      navigation.navigate('Paywall', { source: 'limit' });
      return false;
    }
    return true;
  }, [isPremium, navigation]);
};

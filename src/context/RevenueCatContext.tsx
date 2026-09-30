import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

/**
 * Configuration RevenueCat (projet "viraly", app "viraly (App Store)")
 * - La clé publique (appl_...) peut être dans le code, ce n'est pas un secret.
 * - Entitlement "premium" : débloqué par viraly_premium_monthly et viraly_premium_yearly.
 * - Offering "default" : packages $rc_monthly et $rc_annual.
 */
const REVENUECAT_IOS_API_KEY = 'appl_wuzSzkxJOpRxiMgIJKDmiliVBiB';
export const ENTITLEMENT_ID = 'premium';

interface RevenueCatContextType {
  isPremium: boolean;
  isLoading: boolean;
  currentOffering: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  monthlyPrice: string | null;
  annualPrice: string | null;
  customerInfo: CustomerInfo | null;
  /** Achète un package. Renvoie true si l'utilisateur est premium après l'achat, false s'il a annulé. */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restaure les achats. Renvoie true si un abonnement actif a été retrouvé. */
  restorePurchases: () => Promise<boolean>;
  checkPremiumStatus: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

const hasPremium = (info: CustomerInfo | null) =>
  !!info && info.entitlements.active[ENTITLEMENT_ID] !== undefined;

export const RevenueCatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const applyCustomerInfo = useCallback((info: CustomerInfo) => {
    setCustomerInfo(info);
    const premium = hasPremium(info);
    setIsPremium(premium);
    return premium;
  }, []);

  const checkPremiumStatus = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      return applyCustomerInfo(info);
    } catch (error) {
      console.error('Erreur vérification statut premium:', error);
      return false;
    }
  }, [applyCustomerInfo]);

  const loadOffering = useCallback(async () => {
    try {
      const offerings = await Purchases.getOfferings();
      setCurrentOffering(offerings.current ?? null);
      if (!offerings.current) {
        console.warn('RevenueCat : aucune offering courante (vérifie l\'offering "default")');
      }
    } catch (error) {
      console.error('Erreur chargement offering:', error);
    }
  }, []);

  // 1) Initialisation du SDK (une seule fois)
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      // Android pas encore configuré dans RevenueCat
      setIsLoading(false);
      return;
    }

    try {
      Purchases.configure({ apiKey: REVENUECAT_IOS_API_KEY });
      setIsConfigured(true);
    } catch (error) {
      console.error('Erreur initialisation RevenueCat:', error);
      setIsLoading(false);
      return;
    }

    // Mises à jour en temps réel (renouvellement, expiration, achat sur un autre appareil...)
    const listener = (info: CustomerInfo) => applyCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [applyCustomerInfo]);

  // 2) Relier l'abonnement au compte Firebase : un abonné le reste sur tous ses appareils
  useEffect(() => {
    if (!isConfigured) return;

    const syncUser = async () => {
      setIsLoading(true);
      try {
        const isRealUser = !!user && !user.isGuest && user.uid !== 'guest';
        if (isRealUser) {
          const { customerInfo: info } = await Purchases.logIn(user!.uid);
          applyCustomerInfo(info);
        } else if (!(await Purchases.isAnonymous())) {
          const info = await Purchases.logOut();
          applyCustomerInfo(info);
        } else {
          await checkPremiumStatus();
        }
        await loadOffering();
      } catch (error) {
        console.error('Erreur synchronisation RevenueCat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    syncUser();
  }, [isConfigured, user?.uid, user?.isGuest, applyCustomerInfo, checkPremiumStatus, loadOffering]);

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      return applyCustomerInfo(info);
    } catch (error: any) {
      if (error?.userCancelled) {
        return false; // annulé par l'utilisateur : pas une erreur
      }
      console.error('Erreur lors de l\'achat:', error);
      throw error;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    const info = await Purchases.restorePurchases();
    return applyCustomerInfo(info);
  };

  const monthlyPackage = currentOffering?.monthly ?? null;
  const annualPackage = currentOffering?.annual ?? null;

  const value: RevenueCatContextType = {
    isPremium,
    isLoading,
    currentOffering,
    monthlyPackage,
    annualPackage,
    monthlyPrice: monthlyPackage?.product.priceString ?? null,
    annualPrice: annualPackage?.product.priceString ?? null,
    customerInfo,
    purchasePackage,
    restorePurchases,
    checkPremiumStatus,
  };

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
};

export const useRevenueCat = (): RevenueCatContextType => {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};

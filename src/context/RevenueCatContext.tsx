import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

/**
 * Configuration RevenueCat
 */
const REVENUECAT_API_KEY = 'appl_fKcBudrMKJraQlUjxrSjDQuVxUH'; // À remplacer par votre clé API
const ENTITLEMENT_ID = 'pro';
const OFFERING_ID = 'default';
const PRODUCT_ID = 'viraly_premium_monthly';

/**
 * Type pour le contexte RevenueCat
 */
interface RevenueCatContextType {
  isPremium: boolean;
  isLoading: boolean;
  currentOffering: PurchasesOffering | null;
  monthlyPackage: PurchasesPackage | null;
  monthlyPrice: string | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

/**
 * Provider RevenueCat
 * Gère l'initialisation du SDK et le statut premium
 */
export const RevenueCatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  /**
   * Vérifie le statut premium de l'utilisateur
   */
  const checkPremiumStatus = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Vérifier si l'utilisateur a l'entitlement "pro"
      const hasProEntitlement = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPremium(hasProEntitlement);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut premium:', error);
      setIsPremium(false);
    }
  };

  /**
   * Charge l'offering par défaut et trouve le package mensuel
   */
  const loadOffering = async () => {
    try {
      const offering = await Purchases.getOfferings();
      
      if (offering.current) {
        setCurrentOffering(offering.current);
        
        console.log('Offering trouvé:', offering.current.identifier);
        console.log('Packages disponibles:', offering.current.availablePackages.map(p => ({
          identifier: p.identifier,
          productId: p.product.identifier
        })));
        
        // Trouver le package mensuel dans l'offering
        // Chercher par identifiant de package ou par identifiant de produit store
        const monthlyPkg = offering.current.availablePackages.find(
          (pkg) => 
            pkg.identifier === PRODUCT_ID || 
            pkg.product.identifier === PRODUCT_ID ||
            pkg.identifier.includes('monthly') ||
            pkg.identifier.includes('MONTHLY')
        );

        if (monthlyPkg) {
          console.log('Package mensuel trouvé:', monthlyPkg.identifier);
          setMonthlyPackage(monthlyPkg);
          // Formater le prix
          const price = monthlyPkg.product.priceString;
          setMonthlyPrice(price);
        } else {
          // Si le package spécifique n'est pas trouvé, prendre le premier package disponible
          const firstPackage = offering.current.availablePackages[0];
          if (firstPackage) {
            console.warn(`Package ${PRODUCT_ID} non trouvé, utilisation du premier package disponible: ${firstPackage.identifier}`);
            setMonthlyPackage(firstPackage);
            setMonthlyPrice(firstPackage.product.priceString);
          } else {
            console.error('Aucun package disponible dans l\'offering');
          }
        }
      } else {
        console.warn('Aucune offering courante disponible');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'offering:', error);
    }
  };

  /**
   * Initialise RevenueCat SDK
   */
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        setIsLoading(true);

        // Initialiser RevenueCat avec la clé API appropriée selon la plateforme
        if (Platform.OS === 'ios') {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        } else if (Platform.OS === 'android') {
          // Pour Android, utilisez votre clé API Android
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        }

        console.log('RevenueCat initialisé avec succès');

        // Définir l'identifiant utilisateur si nécessaire (optionnel)
        // await Purchases.logIn(userId);

        // Charger les offres et le statut premium
        await checkPremiumStatus();
        await loadOffering();

        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de RevenueCat:', error);
        setIsLoading(false);
      }
    };

    initializeRevenueCat();
  }, []);


  /**
   * Achete un package
   */
  const purchasePackage = async (pkg: PurchasesPackage) => {
    try {
      setIsLoading(true);
      
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(customerInfo);
      
      // Vérifier si l'achat a réussi
      const hasProEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPremium(hasProEntitlement);
      
      if (!hasProEntitlement) {
        throw new Error('L\'achat n\'a pas débloqué l\'entitlement premium');
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'achat:', error);
      
      // Ne pas considérer l'annulation utilisateur comme une erreur
      if (error.userCancelled) {
        throw new Error('Achat annulé par l\'utilisateur');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Restaure les achats précédents
   */
  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);
      
      // Vérifier le statut premium après restauration
      const hasProEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPremium(hasProEntitlement);
    } catch (error) {
      console.error('Erreur lors de la restauration des achats:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: RevenueCatContextType = {
    isPremium,
    isLoading,
    currentOffering,
    monthlyPackage,
    monthlyPrice,
    customerInfo,
    purchasePackage,
    restorePurchases,
    checkPremiumStatus,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte RevenueCat
 */
export const useRevenueCat = (): RevenueCatContextType => {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};


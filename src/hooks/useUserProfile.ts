import { useState, useEffect } from 'react';
import { doc, getDoc } from '../services/firestoreWrapper';
import { db } from '../../firebase';
import { useAuth } from './useAuth';

/**
 * Hook pour vérifier si le profil utilisateur est complet
 * Le profil est considéré comme complet si les réponses du questionnaire sont présentes dans Firestore
 * 
 * @returns {Object} { hasCompleteProfile, loading, profileData }
 */
export const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [hasCompleteProfile, setHasCompleteProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  // Vérification PRIORITAIRE AVANT TOUT : si user est invité, retourner immédiatement
  // Cette vérification doit être faite AVANT même le useEffect pour éviter tout appel Firestore
  // Double vérification avec isGuest ET uid === 'guest'
  if (user?.isGuest === true || user?.uid === 'guest') {
    // Retourner immédiatement sans attendre - pas de loading, profil complet
    return {
      hasCompleteProfile: true,
      loading: false,
      profileData: { isGuest: true },
    };
  }

  useEffect(() => {
    // Mode invité : bypass complet - pas de loading, profil complet immédiatement
    // Vérification PRIORITAIRE avec isGuest - AVANT toute autre logique
    // Triple vérification pour être absolument sûr
    if (user?.isGuest === true || user?.uid === 'guest') {
      setHasCompleteProfile(true);
      setProfileData({ isGuest: true });
      setProfileLoading(false);
      return; // Ne pas exécuter le reste du useEffect - AUCUN appel Firestore
    }

    if (authLoading) {
      return;
    }

    if (!user) {
      // Pas d'utilisateur connecté
      setHasCompleteProfile(false);
      setProfileData(null);
      setProfileLoading(false);
      return;
    }

    // Vérifier si le profil est complet dans Firestore
    // Protection contre les invités - AUCUN appel Firestore
    const checkProfileComplete = async () => {
      // Triple vérification : si c'est un invité, ne pas appeler Firestore
      // Vérification AVANT tout appel Firestore
      if (user.isGuest === true || user.uid === 'guest') {
        setHasCompleteProfile(true);
        setProfileData({ isGuest: true });
        setProfileLoading(false);
        return; // Sortir immédiatement - AUCUN appel Firestore
      }

      // Protection supplémentaire : vérifier une dernière fois avant getDoc
      // Si l'utilisateur est devenu invité entre temps, ne pas appeler Firestore
      if (user.isGuest === true || user.uid === 'guest') {
        setHasCompleteProfile(true);
        setProfileData({ isGuest: true });
        setProfileLoading(false);
        return;
      }

      try {
        // Appel Firestore UNIQUEMENT si toutes les vérifications passent
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Vérifier si le questionnaire a été complété
          // Le profil est complet si questionnaireAnswers existe OU si les champs individuels existent
          const hasQuestionnaireAnswers = 
            userData.questionnaireAnswers !== undefined ||
            (userData.level !== undefined && userData.niches !== undefined);
          
          setHasCompleteProfile(hasQuestionnaireAnswers);
          setProfileData(userData);
        } else {
          // Pas de document Firestore, profil incomplet
          setHasCompleteProfile(false);
          setProfileData(null);
        }
      } catch (error) {
        // En cas d'erreur, considérer le profil comme incomplet
        console.warn('Impossible de vérifier le profil complet:', error.code || error.message);
        setHasCompleteProfile(false);
        setProfileData(null);
      } finally {
        setProfileLoading(false);
      }
    };

    checkProfileComplete();
  }, [user, authLoading]);

  // Retourner l'état actuel (pour les utilisateurs non-invités)
  // Note: Si user est invité, cette partie ne sera jamais atteinte grâce à la vérification en haut
  return {
    hasCompleteProfile,
    loading: authLoading || profileLoading,
    profileData,
  };
};



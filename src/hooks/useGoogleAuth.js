import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { handleGoogleAuthResponse } from '../services/authService';
import { getGoogleAuthConfig } from '../services/authService';

/**
 * Hook personnalisé pour gérer l'authentification Google
 * Utilise expo-auth-session pour la compatibilité Expo
 * 
 * @returns {Object} { request, response, promptAsync, loginWithGoogle, loading, error }
 */
export const useGoogleAuth = () => {
  const [error, setError] = useState(null);
  
  // Configuration du provider Google
  const config = getGoogleAuthConfig();
  
  // Hook expo-auth-session (doit être dans un composant React)
  const [request, response, promptAsync] = Google.useAuthRequest(config);

  // Note: La réponse est gérée dans loginWithGoogle, pas ici
  // pour éviter la double gestion et avoir un meilleur contrôle

  /**
   * Fonction pour lancer la connexion Google
   * @returns {Promise<Object>} Informations de l'utilisateur connecté
   */
  const loginWithGoogle = async () => {
    try {
      setError(null);
      // Lancer le flux d'authentification Google avec useProxy: true
      const result = await promptAsync({
        useProxy: true,
        redirectUri: "https://auth.expo.dev/@maloxi/viraly",
      });
      
      // Si l'utilisateur a annulé
      if (result.type === 'cancel') {
        throw new Error('Connexion annulée par l\'utilisateur');
      }
      
      // Traiter la réponse et connecter à Firebase
      const user = await handleGoogleAuthResponse(result);
      
      return user;
    } catch (error) {
      console.error('Erreur loginWithGoogle:', error);
      setError(error.message || 'Une erreur est survenue');
      throw error;
    }
  };

  return {
    request,
    response,
    promptAsync,
    loginWithGoogle,
    loading: request === null,
    error,
  };
};


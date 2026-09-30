import { useEffect, useRef, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { handleGoogleAuthResponse, getGoogleAuthConfig } from '../services/authService';

/**
 * Hook pour la connexion Google (expo-auth-session, sans le proxy Expo qui n'existe plus).
 *
 * Fonctionnement sur iOS :
 * 1. promptAsync() ouvre la page Google et renvoie un "code"
 * 2. expo-auth-session échange ce code contre un "id_token" EN ARRIÈRE-PLAN
 *    -> le jeton arrive dans `response` (pas dans le retour de promptAsync)
 * 3. on transmet l'id_token à Firebase Auth
 *
 * @returns {{ loginWithGoogle: () => Promise<any>, ready: boolean, error: string | null }}
 */
export const useGoogleAuth = () => {
  const [error, setError] = useState(null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(getGoogleAuthConfig());
  const pendingRef = useRef(null); // { resolve, reject } de la connexion en cours

  // Quand le jeton Google est prêt, connecter à Firebase
  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending || !response) return;

    if (response.type === 'success') {
      if (!response.params?.id_token) return; // échange du code encore en cours
      pendingRef.current = null;
      handleGoogleAuthResponse(response).then(pending.resolve).catch((err) => {
        setError(err?.message || 'Une erreur est survenue');
        pending.reject(err);
      });
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      pendingRef.current = null;
      pending.resolve(null); // annulé par l'utilisateur : pas d'erreur
    } else {
      pendingRef.current = null;
      const err = new Error(`Connexion Google échouée (${response.type})`);
      setError(err.message);
      pending.reject(err);
    }
  }, [response]);

  /**
   * Lance la connexion Google.
   * @returns {Promise<Object|null>} l'utilisateur connecté, ou null si annulé
   */
  const loginWithGoogle = () =>
    new Promise((resolve, reject) => {
      setError(null);
      pendingRef.current = { resolve, reject };
      promptAsync().then((result) => {
        // Si annulé, `response` peut ne pas changer : on termine ici
        if (result?.type === 'cancel' || result?.type === 'dismiss') {
          if (pendingRef.current) {
            pendingRef.current = null;
            resolve(null);
          }
        } else if (result?.type !== 'success' && pendingRef.current) {
          pendingRef.current = null;
          reject(new Error(`Connexion Google échouée (${result?.type})`));
        }
      }).catch((err) => {
        pendingRef.current = null;
        reject(err);
      });
    });

  return {
    loginWithGoogle,
    ready: request !== null,
    error,
  };
};

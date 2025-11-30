import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';

/**
 * Type pour l'utilisateur
 */
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isGuest?: boolean;
}

/**
 * Type pour le contexte d'authentification
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider d'authentification
 * UN SEUL listener onAuthStateChanged dans tout le projet
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const listenerUnsubscribeRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Fonction pour définir l'utilisateur (utilisée pour le mode invité)
  const setUser = (userData: User | null) => {
    if (userData && userData.isGuest === true) {
      // Mode invité : définir directement sans Firebase
      setUserState({
        uid: 'guest',
        email: null,
        isGuest: true,
      });
      setLoading(false);
      return;
    }
    
    // Utilisateur normal
    setUserState(userData);
    setLoading(false);
  };

  useEffect(() => {
    // UN SEUL listener Firebase Auth dans tout le projet
    // Ne pas créer de listener si déjà initialisé
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;
    setLoading(true);

    // S'abonner aux changements d'état d'authentification Firebase
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Vérifier l'état actuel de user pour éviter d'écraser le mode invité
      setUserState((currentUser) => {
        // Si on est en mode invité, ne pas écraser avec Firebase
        if (currentUser?.isGuest === true) {
          setLoading(false);
          return currentUser;
        }

        if (firebaseUser) {
          // Utilisateur connecté Firebase
          // Utiliser UNIQUEMENT les données Firebase Auth (pas Firestore)
          setLoading(false);
          return {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || null,
            photoURL: firebaseUser.photoURL || null,
            isGuest: false,
          };
        } else {
          // Utilisateur déconnecté
          // Ne pas écraser si on est en mode invité
          setLoading(false);
          return currentUser?.isGuest ? currentUser : null;
        }
      });
    });

    listenerUnsubscribeRef.current = unsubscribe;

    // Nettoyer le listener lors du démontage
    return () => {
      if (listenerUnsubscribeRef.current) {
        listenerUnsubscribeRef.current();
        listenerUnsubscribeRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []); // Dépendances vides - ne s'exécute qu'une fois au montage

  const value: AuthContextType = {
    user,
    loading,
    setUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook pour utiliser le contexte d'authentification
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


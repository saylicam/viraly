import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedScreenProps {
  children: React.ReactNode;
}

/**
 * Composant pour protéger les écrans qui nécessitent une authentification
 * Simplifié - plus de vérifications de profil ici
 * Les écrans individuels gèrent leur propre logique
 */
export const ProtectedScreen: React.FC<ProtectedScreenProps> = ({ children }) => {
  const { user } = useAuth();

  // Mode invité : bypass complet - accès immédiat
  if (user?.isGuest === true || user?.uid === 'guest') {
    return <>{children}</>;
  }

  // Pour les utilisateurs connectés, afficher le contenu
  // Plus de vérification de profil - les écrans gèrent leur propre logique
  if (user) {
    return <>{children}</>;
  }

  // Si pas d'utilisateur, ne rien afficher
  // La navigation sera gérée par les écrans individuels
  return null;
};



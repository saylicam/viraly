import React from 'react';
import { useAuth } from '../hooks/useAuth';

/** N'affiche le contenu que pour un utilisateur connecté (un compte est obligatoire). */
export const ProtectedScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : null;
};

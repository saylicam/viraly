import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import { signOut as firebaseSignOut } from 'firebase/auth';
import Purchases from 'react-native-purchases';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { cancelAllLocalNotifications } from '../services/notifications';
import { useAuth } from './AuthContext';
import { fetchRemoteProfile, loadLocalProfile, setLocalProfile, profileToAnswers } from '../services/creatorProfile';
import { finalizeOnboarding } from '../services/onboarding';
import { clearLocalUserData, getDataOwner, setDataOwner } from '../services/localData';

/**
 * Où en est l'utilisateur ? C'est ce statut (et lui seul) qui choisit les écrans affichés :
 * - signedOut    : pas de compte connecté → intro, questionnaire, connexion
 * - needsProfile : connecté mais sans profil (questionnaire jamais terminé) → questionnaire
 * - ready        : connecté avec un profil → accueil, directement, à chaque ouverture
 * - error        : impossible de relire le profil du compte (pas de réseau) → écran « Réessayer »
 *
 * Règle d'or : un compte qui a déjà un profil ne refait JAMAIS le questionnaire,
 * même après une réinstallation ou sur un nouveau téléphone (le profil est relu depuis Firestore).
 */
export type SessionStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready' | 'error';

interface SessionContextType {
  status: SessionStatus;
  retry: () => void;
  /** Compte sans profil qui vient de finir le questionnaire */
  completeProfile: (answers: Record<string, string[]>) => Promise<void>;
  /** true juste après la création du compte : l'écran Premium s'affiche une fois */
  welcomePaywall: boolean;
  consumeWelcomePaywall: () => void;
  /** Déconnexion propre : RevenueCat, Firebase, puis effacement des données du téléphone */
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

type Resolved = { status: SessionStatus; welcomePaywall?: boolean };

const resolveSession = async (uid: string): Promise<Resolved> => {
  const owner = await getDataOwner();
  // Données d'un autre compte sur ce téléphone : on repart de zéro
  if (owner && owner !== uid) await clearLocalUserData();

  const local = await loadLocalProfile();
  // Ouverture habituelle : profil déjà sur le téléphone pour ce compte → accueil tout de suite
  // (useCreatorProfile relit ensuite le compte en arrière-plan)
  if (owner === uid && local?.level) return { status: 'ready' };

  let remote;
  try {
    remote = await fetchRemoteProfile(uid);
  } catch (e: any) {
    console.warn('⚠️ Profil du compte illisible :', e?.code || e?.message);
    // Profil d'avant la 1.1 sur ce téléphone : on l'utilise, on revérifiera à la prochaine ouverture
    if (!owner && local?.level) return { status: 'ready' };
    return { status: 'error' };
  }

  // Compte existant (réinstallation, nouveau téléphone, reconnexion) : on récupère son profil
  if (remote?.level) {
    await setLocalProfile(remote);
    await setDataOwner(uid);
    return { status: 'ready' };
  }

  // Questionnaire rempli juste avant de créer le compte : on l'enregistre dans le compte
  if (local?.level) {
    await setDataOwner(uid);
    await finalizeOnboarding(profileToAnswers(local), uid).catch(() => {});
    return { status: 'ready', welcomePaywall: true };
  }

  await setDataOwner(uid);
  return { status: 'needsProfile' };
};

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [welcomePaywall, setWelcomePaywall] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const run = useRef(0);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (authLoading) return;
    const id = ++run.current;

    if (!uid) {
      setWelcomePaywall(false);
      (async () => {
        // Session terminée (déconnexion, compte supprimé, session expirée) : rien ne doit rester
        if (await getDataOwner()) await clearLocalUserData();
        if (run.current === id) setStatus('signedOut');
      })();
      return;
    }

    setStatus('loading');
    resolveSession(uid)
      .then((r) => {
        if (run.current !== id) return;
        if (r.welcomePaywall) setWelcomePaywall(true);
        setStatus(r.status);
      })
      .catch(() => { if (run.current === id) setStatus('error'); });
  }, [uid, authLoading, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const completeProfile = useCallback(async (answers: Record<string, string[]>) => {
    if (!uid) return;
    await finalizeOnboarding(answers, uid).catch(() => {});
    await setDataOwner(uid);
    setWelcomePaywall(true);
    setStatus('ready');
  }, [uid]);

  const consumeWelcomePaywall = useCallback(() => setWelcomePaywall(false), []);

  const signOut = useCallback(async () => {
    // Ce téléphone ne doit plus recevoir les notifications de ce compte
    const current = auth.currentUser;
    if (current) {
      await setDoc(doc(db, 'users', current.uid), { notificationsEnabled: false }, { merge: true }).catch(() => {});
    }
    await cancelAllLocalNotifications();
    if (Platform.OS === 'ios') {
      try {
        if (!(await Purchases.isAnonymous())) await Purchases.logOut();
      } catch (e) {
        console.warn('Déconnexion RevenueCat :', e);
      }
    }
    await firebaseSignOut(auth);
    await clearLocalUserData();
  }, []);

  return (
    <SessionContext.Provider value={{ status, retry, completeProfile, welcomePaywall, consumeWelcomePaywall, signOut }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
};

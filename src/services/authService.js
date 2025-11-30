import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { 
  signInWithCredential, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential as firebaseSignInWithCredential
} from 'firebase/auth';
import { GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from './firestoreWrapper';
import { auth, db } from '../../firebase';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Configuration pour expo-web-browser
WebBrowser.maybeCompleteAuthSession();

/**
 * Service d'authentification Firebase avec Google Login pour React Native/Expo
 * Utilise expo-auth-session pour la compatibilité Expo
 */

// Configuration Google OAuth
// ⚠️ IMPORTANT : Remplacez par votre Client ID Google depuis Google Cloud Console
// Format : "xxxxx.apps.googleusercontent.com"
const getGoogleClientId = () => {
  return Constants.expoConfig?.extra?.googleClientId || 
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
};

/**
 * Crée la configuration du provider Google pour expo-auth-session
 * ⚠️ Cette fonction doit être appelée dans un composant React avec useAuthRequest
 * @returns {Object} Configuration pour useAuthRequest
 */
export const getGoogleAuthConfig = () => {
  return {
    clientId: getGoogleClientId(),
    scopes: ['openid', 'profile', 'email'],
    redirectUri: "https://auth.expo.dev/@maloxi/viraly",
  };
};

/**
 * Traite la réponse d'authentification Google et connecte l'utilisateur à Firebase
 * Cette fonction est appelée après que l'utilisateur a complété l'authentification Google
 * @param {Object} authResult - Résultat de l'authentification Google (depuis useAuthRequest)
 * @returns {Promise<Object>} Objet contenant les informations de l'utilisateur
 * @throws {Error} En cas d'erreur lors de la connexion
 */
export const handleGoogleAuthResponse = async (authResult) => {
  try {
    if (authResult.type === 'cancel') {
      throw new Error('Connexion annulée par l\'utilisateur');
    }

    if (authResult.type !== 'success') {
      throw new Error(`Erreur d'authentification: ${authResult.type}`);
    }

    // Récupérer le token ID depuis la réponse
    const { id_token } = authResult.params;
    
    if (!id_token) {
      throw new Error('Token ID manquant dans la réponse');
    }

    // Créer les credentials Firebase avec le token Google
    const credential = GoogleAuthProvider.credential(id_token);

    // Se connecter à Firebase avec les credentials Google
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Enregistrer ou mettre à jour l'utilisateur dans Firestore
    await saveUserToFirestore(user);

    // Retourner les informations de l'utilisateur formatées
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error('Erreur lors de la connexion Google:', error);
    throw {
      code: error.code || 'auth/unknown',
      message: error.message || 'Une erreur est survenue lors de la connexion',
      originalError: error,
    };
  }
};

/**
 * Enregistre ou met à jour l'utilisateur dans Firestore
 * Collection: users
 * Document ID: UID Firebase
 * @param {Object} user - Objet utilisateur Firebase
 * @returns {Promise<void>} Ne throw pas d'erreur pour ne pas bloquer l'authentification
 */
const saveUserToFirestore = async (user) => {
  // Protection contre les invités - AUCUN appel Firestore
  if (user.uid === 'guest' || user.isGuest === true) {
    console.log('✅ Mode invité : utilisateur non enregistré dans Firestore');
    return;
  }

  const userRef = doc(db, 'users', user.uid);
  
  // Préparer les données utilisateur
  const userData = {
    uid: user.uid,
    email: user.email || null,
    name: user.displayName || null,
    photoURL: user.photoURL || null,
    updatedAt: serverTimestamp(),
  };

  // Essayer de lire le document existant (avec gestion spécifique de "unavailable")
  let userDoc = null;
  try {
    userDoc = await getDoc(userRef);
  } catch (readError) {
    // Gestion spécifique de l'erreur "unavailable"
    if (readError.code === 'unavailable') {
      // Si Firestore est unavailable, on skip la lecture et on crée le document directement
      console.warn('Firestore unavailable, création du document sans lecture préalable');
    } else {
      // Autres erreurs : on continue quand même
      console.warn('Impossible de lire le document Firestore:', readError.code || readError.message);
    }
  }

  // Si l'utilisateur n'existe pas (ou si on n'a pas pu lire), ajouter createdAt
  if (!userDoc || !userDoc.exists()) {
    userData.createdAt = serverTimestamp();
  }

  // Enregistrer ou mettre à jour l'utilisateur avec gestion d'erreur "unavailable"
  try {
    await setDoc(userRef, userData, { merge: true });
    console.log('✅ Utilisateur enregistré dans Firestore:', user.uid);
  } catch (error) {
    // Gestion spécifique de l'erreur "unavailable"
    if (error.code === 'unavailable') {
      // Si Firestore est unavailable, on log mais on ne bloque pas
      // Firebase va retenter automatiquement quand la connexion sera rétablie
      console.warn('⚠️ Firestore unavailable lors de l\'enregistrement, retry automatique prévu:', user.uid);
    } else {
      // Autres erreurs
      console.warn('⚠️ Erreur lors de l\'enregistrement dans Firestore (non bloquant):', error.code || error.message);
    }
    // Ne pas throw - l'authentification doit continuer même si Firestore échoue
  }
};

/**
 * Déconnexion de l'utilisateur
 * @returns {Promise<void>}
 * @throws {Error} En cas d'erreur lors de la déconnexion
 */
export const logout = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('Utilisateur déconnecté');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    throw {
      code: error.code || 'auth/unknown',
      message: error.message || 'Une erreur est survenue lors de la déconnexion',
      originalError: error,
    };
  }
};

/**
 * Écouteur global pour l'état d'authentification
 * Permet de garder l'utilisateur connecté même après fermeture de l'app
 * @param {Function} callback - Fonction appelée à chaque changement d'état
 * @returns {Function} Fonction pour désabonner l'écouteur
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // Utilisateur connecté
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
    } else {
      // Utilisateur déconnecté
      callback(null);
    }
  });
};

/**
 * Récupère l'utilisateur actuellement connecté
 * @returns {Object|null} Informations de l'utilisateur ou null si non connecté
 */
export const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
};

/**
 * Sauvegarde les réponses du questionnaire dans Firestore
 * @param {string} userId - UID de l'utilisateur
 * @param {Object} questionnaireAnswers - Réponses du questionnaire
 * @returns {Promise<void>}
 */
export const saveQuestionnaireAnswers = async (userId, questionnaireAnswers) => {
  // Bypasser Firestore si l'utilisateur est en mode invité
  // Protection contre les invités - AUCUN appel Firestore
  // Vérification PRIORITAIRE : si userId est 'guest', ne pas appeler Firestore
  if (userId === 'guest' || userId === null || userId === undefined) {
    console.log('✅ Mode invité : réponses du questionnaire non sauvegardées (pas de Firestore)');
    return; // Sortir immédiatement - AUCUN appel Firestore
  }

  try {
    const userRef = doc(db, 'users', userId);
    
    // Sauvegarder les réponses du questionnaire
    await setDoc(userRef, {
      questionnaireAnswers: questionnaireAnswers,
      questionnaireCompletedAt: serverTimestamp(),
      // Extraire aussi les valeurs principales pour faciliter les requêtes
      level: questionnaireAnswers.level?.[0] || null,
      niches: questionnaireAnswers.niches || [],
      frequency: questionnaireAnswers.frequency?.[0] || null,
      goal: questionnaireAnswers.goal?.[0] || null,
    }, { merge: true });
    
    console.log('✅ Réponses du questionnaire sauvegardées dans Firestore:', userId);
  } catch (error) {
    // Gestion spécifique de l'erreur "unavailable"
    if (error.code === 'unavailable') {
      console.warn('⚠️ Firestore unavailable lors de la sauvegarde du questionnaire, retry automatique prévu');
    } else {
      console.error('Erreur lors de la sauvegarde des réponses du questionnaire:', error);
      throw error;
    }
  }
};

/**
 * Inscription avec email et mot de passe
 * @param {string} email - Adresse email de l'utilisateur
 * @param {string} password - Mot de passe de l'utilisateur
 * @returns {Promise<Object>} Objet contenant les informations de l'utilisateur
 * @throws {Error} En cas d'erreur lors de l'inscription
 */
export const registerWithEmail = async (email, password) => {
  try {
    // Créer l'utilisateur avec Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Enregistrer l'utilisateur dans Firestore
    await saveUserToFirestore(user);

    // Retourner les informations de l'utilisateur formatées
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    throw {
      code: error.code || 'auth/unknown',
      message: error.message || 'Une erreur est survenue lors de l\'inscription',
      originalError: error,
    };
  }
};

/**
 * Connexion avec email et mot de passe
 * @param {string} email - Adresse email de l'utilisateur
 * @param {string} password - Mot de passe de l'utilisateur
 * @returns {Promise<Object>} Objet contenant les informations de l'utilisateur
 * @throws {Error} En cas d'erreur lors de la connexion
 */
export const loginWithEmail = async (email, password) => {
  try {
    // Connecter l'utilisateur avec Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Mettre à jour l'utilisateur dans Firestore (dernière connexion)
    await saveUserToFirestore(user);

    // Retourner les informations de l'utilisateur formatées
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    throw {
      code: error.code || 'auth/unknown',
      message: error.message || 'Une erreur est survenue lors de la connexion',
      originalError: error,
    };
  }
};

/**
 * Connexion avec Apple Sign In
 * Utilise expo-apple-authentication pour iOS
 * @returns {Promise<Object>} Objet contenant les informations de l'utilisateur
 * @throws {Error} En cas d'erreur lors de la connexion
 */
export const signInWithApple = async () => {
  try {
    // Vérifier que Apple Authentication est disponible (iOS uniquement)
    if (Platform.OS !== 'ios') {
      throw new Error('La connexion Apple n\'est disponible que sur iOS');
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple Sign In n\'est pas disponible sur cet appareil');
    }

    // Demander les credentials Apple
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Créer le provider OAuth pour Firebase
    const { identityToken, nonce } = credential;
    
    if (!identityToken) {
      throw new Error('Token d\'identité Apple manquant');
    }

    // Créer le credential Firebase avec le provider Apple
    const appleProvider = new OAuthProvider('apple.com');
    const firebaseCredential = appleProvider.credential({
      idToken: identityToken,
      rawNonce: nonce,
    });

    // Connecter l'utilisateur à Firebase
    const userCredential = await firebaseSignInWithCredential(auth, firebaseCredential);
    const user = userCredential.user;

    // Préparer les données utilisateur
    // Note: Apple peut ne pas fournir l'email à chaque fois
    const userData = {
      uid: user.uid,
      email: user.email || credential.email || null,
      displayName: 
        credential.fullName 
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : user.displayName || null,
      photoURL: null, // Apple ne fournit pas de photo de profil
    };

    // Enregistrer ou mettre à jour l'utilisateur dans Firestore
    await saveUserToFirestore({
      ...user,
      email: userData.email,
      displayName: userData.displayName,
    });

    return userData;
  } catch (error) {
    console.error('Erreur lors de la connexion Apple:', error);

    // Si l'utilisateur a annulé
    if (error.code === 'ERR_REQUEST_CANCELED') {
      throw {
        code: 'auth/cancelled',
        message: 'Connexion annulée par l\'utilisateur',
        originalError: error,
      };
    }

    throw {
      code: error.code || 'auth/unknown',
      message: error.message || 'Une erreur est survenue lors de la connexion Apple',
      originalError: error,
    };
  }
};



import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * Configuration Firebase pour Expo/React Native
 * Les valeurs sont récupérées depuis les variables d'environnement via expo-constants
 * Variables définies dans .env et exposées via app.config.js
 */
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "AIzaSyB6X3DvOG_z2synzYA7E5sN70GwKJRG3gY",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "viraly-01.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || "viraly-01",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "viraly-01.firebasestorage.app",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "143996912608",
  appId: Constants.expoConfig?.extra?.firebaseAppId || "1:143996912608:web:da8d73bddf00d6e38e6185",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence for React Native
// This ensures auth state persists between app sessions
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore with long polling for React Native
// experimentalAutoDetectLongPolling enables automatic detection of long polling
// useFetchStreams: false is required for Expo Go compatibility
// which is necessary for React Native environments
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});

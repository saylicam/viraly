// Load environment variables from .env at config time
require('dotenv/config');

/** @type {import('@expo/config').ExpoConfig} */
module.exports = () => {
  return {
    expo: {
      name: "Viraly",
      slug: "viraly",
      owner: "maloxi",
      scheme: "viraly",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "dark",
      assetBundlePatterns: ["**/*"],

      ios: {
        // iPhone uniquement (évite d'avoir à fournir des captures iPad)
        supportsTablet: false,
        bundleIdentifier: "com.viraly.app",
        // Configuration requise pour valider le chiffrement chez Apple
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false
        }
      },

      android: {
        package: "com.viraly.app",
      },

      web: {
        bundler: "metro",
        useWebkit: true
      },

      plugins: [
        [
          "expo-image-picker",
          {
            photosPermission: "Viraly a besoin d'accéder à tes vidéos pour que tu puisses choisir celle à analyser.",
          }
        ],
        [
          "expo-camera",
          {
            cameraPermission: "Viraly utilise la caméra pour filmer une vidéo à analyser.",
            microphonePermission: "Viraly utilise le micro pour enregistrer le son de tes vidéos.",
          }
        ],
        [
          "expo-media-library",
          {
            photosPermission: "Viraly a besoin d'accéder à tes vidéos pour que tu puisses choisir celle à analyser.",
            savePhotosPermission: "Viraly peut enregistrer des fichiers dans ta photothèque.",
          }
        ],
        "expo-apple-authentication",
        "expo-web-browser"
      ],

      extra: {
        eas: {
          projectId: "33fbc0f6-46a7-4b72-a972-905d48581c11"
        },
        apiUrl: "https://viraly-production-b0cd.up.railway.app",
        // Client OAuth iOS du projet Firebase viraly-01 (Google Cloud > Google Auth Platform > Clients)
        googleIosClientId: "143996912608-n8q4upccattqvo2a6kpku884vmekgqpe.apps.googleusercontent.com",

        firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },

      experiments: {
        redirectSession: true
      }
    }
  };
};
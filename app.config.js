// Load environment variables from .env at config time
require('dotenv/config');

/** @type {import('@expo/config').ExpoConfig} */
// Deux versions de l'app : « Viraly » (App Store / TestFlight) et « Viraly Dev » (tests en direct).
// APP_VARIANT=development → autre nom, autre icône, autre identifiant : les deux cohabitent sur le téléphone.
const IS_DEV = process.env.APP_VARIANT === 'development';

// Clients Google (connexion « Continuer avec Google »)
const GOOGLE_IOS_CLIENT_ID = "143996912608-n8q4upccattqvo2a6kpku884vmekgqpe.apps.googleusercontent.com";
// Client iOS de Viraly Dev (créé en ajoutant l'app iOS com.viraly.app.dev dans Firebase, le 13/10/2026)
const GOOGLE_IOS_CLIENT_ID_DEV = "143996912608-o7o9bvikjhou7ijba8ajh9qit898u6i1.apps.googleusercontent.com";

module.exports = () => {
  return {
    expo: {
      name: IS_DEV ? "Viraly Dev" : "Viraly",
      slug: "viraly",
      owner: "maloxi",
      scheme: IS_DEV ? "viraly-dev" : "viraly",
      version: "1.1.0",
      orientation: "portrait",
      icon: IS_DEV ? "./assets/icon-dev.png" : "./assets/icon.png",
      userInterfaceStyle: "dark",
      assetBundlePatterns: ["**/*"],

      ios: {
        // iPhone uniquement (évite d'avoir à fournir des captures iPad)
        supportsTablet: false,
        bundleIdentifier: IS_DEV ? "com.viraly.app.dev" : "com.viraly.app",
        // Configuration requise pour valider le chiffrement chez Apple
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
          // L'app est en français : l'App Store doit afficher « Français » et non « Anglais »
          CFBundleDevelopmentRegion: "fr",
          CFBundleLocalizations: ["fr"]
        }
      },

      android: {
        package: IS_DEV ? "com.viraly.app.dev" : "com.viraly.app",
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
        "expo-web-browser",
        // Notifications : à réactiver quand la capacité Push sera ajoutée chez Apple
        // [
        //   "expo-notifications",
        //   {
        //     color: "#9013FE"
        //   }
        // ]
      ],

      extra: {
        eas: {
          projectId: "33fbc0f6-46a7-4b72-a972-905d48581c11"
        },
        // « development » pour Viraly Dev : l'app parle alors au serveur du PC (voir src/services/api.ts)
        appVariant: IS_DEV ? "development" : "production",
        // Serveur de production (Railway), utilisé par Viraly
        apiUrl: "https://viraly-production-b0cd.up.railway.app",
        // Client OAuth iOS du projet Firebase viraly-01 (Google Cloud > Google Auth Platform > Clients).
        // Google n'accepte un client iOS que pour SON identifiant d'app : Viraly Dev a donc besoin
        // de son propre client (créé en ajoutant l'app iOS com.viraly.app.dev dans Firebase).
        googleIosClientId: IS_DEV && GOOGLE_IOS_CLIENT_ID_DEV ? GOOGLE_IOS_CLIENT_ID_DEV : GOOGLE_IOS_CLIENT_ID,
        googleDevClientMissing: IS_DEV && !GOOGLE_IOS_CLIENT_ID_DEV,

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
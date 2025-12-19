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
        supportsTablet: true,
        bundleIdentifier: "com.viraly.app",
      },

      android: {
        package: "com.viraly.app",
      },

      web: {
        bundler: "metro",
        useWebkit: true
      },

      plugins: [
        "expo-camera",
        "expo-media-library",
        "expo-apple-authentication",
        "expo-web-browser",          // ← Plugin ajouté ici
      ],

      extra: {
        apiUrl: "http://192.168.0.12:3333",
        googleClientId: "453062794883-3a7vsltfbn8km4fejtcelh5m2uakuti1.apps.googleusercontent.com",
        redirectUrl: "https://auth.expo.dev/@maloxi/viraly",

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










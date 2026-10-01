import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { RevenueCatProvider } from './src/context/RevenueCatContext';
import { LogBox } from 'react-native';

// Annuler un achat n'est pas une erreur : on masque l'écran rouge en développement
LogBox.ignoreLogs(['Purchase was cancelled']);

/**
 * App principale - Navigation simplifiée
 * Utilise AuthProvider pour gérer l'authentification
 * Utilise RevenueCatProvider pour gérer les abonnements
 * Navigation basée uniquement sur user (Firebase Auth), pas Firestore
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RevenueCatProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </RevenueCatProvider>
      </AuthProvider>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

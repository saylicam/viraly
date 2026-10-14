import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { RootNavigator } from './src/navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { RevenueCatProvider } from './src/context/RevenueCatContext';
import { SessionProvider } from './src/context/SessionContext';
import { LogBox } from 'react-native';
import { onNotificationTap } from './src/services/notifications';

const navigationRef = createNavigationContainerRef<any>();

// Annuler un achat n'est pas une erreur : on masque l'écran rouge en développement
LogBox.ignoreLogs(['Purchase was cancelled']);

/**
 * App principale - Navigation simplifiée
 * Utilise AuthProvider pour gérer l'authentification
 * Utilise RevenueCatProvider pour gérer les abonnements
 * Utilise SessionProvider pour choisir les écrans (intro, questionnaire ou accueil)
 */
export default function App() {
    useEffect(() => onNotificationTap((data) => {
    // Appui sur une notification : ouvre l'onglet concerné (Tendances ou Calendrier)
    const tab = data?.screen === 'Calendar' ? 'Calendar' : data?.screen === 'Trends' ? 'Trends' : null;
    if (tab && navigationRef.isReady() && navigationRef.getRootState()?.routeNames?.includes('Main')) {
      navigationRef.navigate('Main', { screen: tab });
    }
  }), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <AuthProvider>
        <SessionProvider>
          <RevenueCatProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
          </RevenueCatProvider>
        </SessionProvider>
      </AuthProvider>
      <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

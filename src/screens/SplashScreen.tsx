import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';

/**
 * SplashScreen - Affiche un loader pendant 1 seconde max puis navigue
 * Vers WelcomeScreen si pas connecté, vers Dashboard si connecté
 * Pas de condition Firestore ici - uniquement Firebase Auth
 */
export default function SplashScreen() {
  const navigation = useNavigation();
  const { user, loading } = useAuth();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Attendre que le chargement soit terminé OU 1 seconde maximum
    const timer = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        
        // Si user existe (connecté ou invité) → Dashboard
        if (user) {
          navigation.replace('Main' as never);
        } else {
          // Sinon → Welcome (flow d'onboarding)
          navigation.replace('Welcome' as never);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigation, user, loading]);

  return (
    <LinearGradient
      colors={['#0B0B15', '#1A103F', '#2B176F', '#1A103F', '#0B0B15']}
      locations={[0, 0.3, 0.5, 0.7, 1]}
      style={styles.container}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


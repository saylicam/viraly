import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { ScreenBackground } from '../components/ui/ScreenBackground';
import { EmailAuthModal } from '../components/EmailAuthModal';
import { signInWithApple, saveQuestionnaireAnswers } from '../services/authService';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  navigation: any;
  route?: {
    params?: {
      answers?: Record<string, string[]>;
    };
  };
}

export default function LoginScreen({ navigation, route }: LoginScreenProps) {
  const { user, setUser } = useAuth();
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const questionnaireAnswers = route?.params?.answers;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Vérifier si Apple Sign In est disponible
  useEffect(() => {
    const checkAppleAuth = async () => {
      if (Platform.OS === 'ios') {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setAppleAvailable(isAvailable);
      }
    };
    checkAppleAuth();
  }, []);

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const hasNavigatedRef = useRef(false);

  // Si l'utilisateur est déjà connecté, rediriger vers Main
  // Protection contre les boucles avec hasNavigatedRef
  useEffect(() => {
    // Condition stricte : user doit être défini et non null
    if (user !== null && user !== undefined && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;

      // Si c'est un invité, navigation déjà gérée par handleGuestMode
      if (user.isGuest === true || user.uid === 'guest') {
        return;
      }

      // Sauvegarder les réponses si présentes (en arrière-plan, non bloquant)
      if (questionnaireAnswers && user.uid !== 'guest' && user.isGuest !== true) {
        saveQuestionnaireAnswers(user.uid, questionnaireAnswers)
          .then(() => {
            console.log('✅ Réponses du questionnaire sauvegardées');
          })
          .catch((error) => {
            console.warn('⚠️ Erreur lors de la sauvegarde des réponses:', error);
          });
      }
      
      // Naviguer vers Main (Dashboard) - une seule fois
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  }, [user]); // Dépendances minimales - seulement user

  const handleAppleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const userData = await signInWithApple();
      
      console.log('✅ Utilisateur connecté avec Apple:', userData);
      
      // Sauvegarder les réponses si présentes et naviguer vers Main
      // Le useEffect avec user va gérer la sauvegarde et navigation
    } catch (err: any) {
      console.error('❌ Erreur de connexion Apple:', err);
      
      // Ne pas afficher d'erreur si l'utilisateur a annulé
      if (err.code !== 'auth/cancelled') {
        setError(err.message || 'Une erreur est survenue lors de la connexion avec Apple');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSuccess = async () => {
    setEmailModalVisible(false);
    // La sauvegarde et navigation seront gérées par le useEffect avec user
  };

  const handleGuestMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Créer un utilisateur invité local (dummy user)
    const guestUser = {
      uid: 'guest',
      email: null,
      isGuest: true,
    };
    
    // Définir l'utilisateur invité dans le contexte
    setUser(guestUser);
    
    // Rediriger DIRECTEMENT vers Dashboard sans appel Firestore
    // Utiliser reset pour éviter de pouvoir revenir en arrière
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Logo / Titre */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.logoGradient}
              >
                <Ionicons name="videocam" size={48} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Enregistre-toi pour sauvegarder ton plan personnalisé et commencer à analyser tes vidéos
            </Text>
          </View>

          {/* Boutons de connexion */}
          <View style={styles.buttonContainer}>
            {/* Bouton Apple (iOS seulement) */}
            {appleAvailable && (
              <TouchableOpacity
                onPress={handleAppleLogin}
                disabled={loading}
                activeOpacity={0.8}
                style={styles.appleButton}
              >
                <BlurView intensity={20} tint="dark" style={styles.appleButtonBlur}>
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.6)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.appleButtonGradient}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.buttonText}>Connexion...</Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons name="logo-apple" size={24} color="#FFFFFF" style={styles.appleIcon} />
                        <Text style={styles.buttonText}>Créer avec Apple</Text>
                      </>
                    )}
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            )}

            {/* Bouton Email/Password */}
            <TouchableOpacity
              onPress={() => {
                setEmailModalVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.emailButton}
            >
              <BlurView intensity={20} tint="dark" style={styles.emailButtonBlur}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emailButtonGradient}
                >
                  <Ionicons name="mail-outline" size={24} color="#FFFFFF" style={styles.emailIcon} />
                  <Text style={styles.buttonText}>Créer avec Email</Text>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            {/* Google désactivé pour l'instant - commenté mais présent dans le code */}
            {/* 
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={isConnecting || loading}
              activeOpacity={0.8}
              style={styles.googleButton}
            >
              <BlurView intensity={20} tint="dark" style={styles.googleButtonBlur}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.googleButtonGradient}
                >
                  <Ionicons name="logo-google" size={24} color="#FFFFFF" style={styles.googleIcon} />
                  <Text style={styles.buttonText}>Continuer avec Google</Text>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
            */}

            {/* Bouton Mode Invité */}
            <TouchableOpacity
              onPress={handleGuestMode}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.guestButton}
            >
              <BlurView intensity={20} tint="dark" style={styles.guestButtonBlur}>
                <LinearGradient
                  colors={['rgba(143, 91, 255, 0.2)', 'rgba(143, 91, 255, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.guestButtonGradient}
                >
                  <Ionicons name="person-outline" size={24} color="#FFFFFF" style={styles.guestIcon} />
                  <Text style={styles.buttonText}>Continuer en tant qu'invité</Text>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Message d'erreur */}
          {error && (
            <Animated.View
              style={[
                styles.errorContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <BlurView intensity={20} tint="dark" style={styles.errorBlur}>
                <View style={styles.errorContent}>
                  <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </BlurView>
            </Animated.View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              En te connectant, tu acceptes nos conditions d'utilisation
            </Text>
          </View>
        </Animated.View>

        {/* Modal Email/Password */}
        <EmailAuthModal
          visible={emailModalVisible}
          onClose={() => setEmailModalVisible(false)}
          onSuccess={handleEmailAuthSuccess}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  appleButton: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  appleButtonBlur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  appleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emailButton: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#8F5BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emailButtonBlur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  emailButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  appleIcon: {
    marginRight: 12,
  },
  emailIcon: {
    marginRight: 12,
  },
  guestButton: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#8F5BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 8,
  },
  guestButtonBlur: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  guestButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(143, 91, 255, 0.3)',
  },
  guestIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorContainer: {
    width: '100%',
    marginBottom: 24,
  },
  errorBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.error,
    lineHeight: 20,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

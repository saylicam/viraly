import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { logout } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { ScreenBackground } from '../components/ui/ScreenBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';

const { width, height } = Dimensions.get('window');
const FIRST_LAUNCH_KEY = '@viraly_first_launch';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const { user, setUser } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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
    ]).start();
  }, []);

  const handleResetProfile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Réinitialisation Système",
      "Tu vas effacer ton profil et recommencer l'aventure à zéro. Confirmes-tu ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "CONFIRMER LE RESET", 
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Déconnecter l'utilisateur Firebase (si connecté)
              if (user && !user.isGuest) {
                try {
                  await signOut(auth);
                } catch (error) {
                  console.warn('Erreur lors de la déconnexion Firebase:', error);
                }
              }

              // 2. Réinitialiser l'utilisateur dans le contexte (supprime guest aussi)
              setUser(null);

              // 3. Effacer les données AsyncStorage
              await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              // 4. Redémarrer l'app sur la première page (Splash)
              navigation.reset({
                index: 0,
                routes: [{ name: 'Splash' }],
              });
            } catch (e) {
              console.error('Erreur lors du reset:', e);
              Alert.alert("Erreur", "Impossible de réinitialiser.");
            }
          }
        }
      ]
    );
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Paywall');
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Déconnexion",
      "Tu veux te déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive",
          onPress: async () => {
            try {
              // Déconnecter Firebase (si connecté)
              if (user && !user.isGuest) {
                await signOut(auth);
              }
              
              // Réinitialiser l'utilisateur
              setUser(null);

              // Rediriger vers Splash
              navigation.reset({
                index: 0,
                routes: [{ name: 'Splash' }],
              });
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert("Erreur", "Impossible de se déconnecter.");
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Profil</Text>
            <Text style={styles.subtitle}>Gère ton compte et tes préférences</Text>
          </View>

          {/* Profile Card */}
          <BlurView intensity={20} tint="dark" style={styles.profileCard}>
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.avatar}
            >
              <Ionicons name="person" size={32} color="white" />
            </LinearGradient>
            
            <Text style={styles.profileName}>Créateur</Text>
            <Text style={styles.profileType}>Débutant·e Lifestyle</Text>
            <Text style={styles.profileGoal}>Objectif : Booster l'engagement</Text>
          </BlurView>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <BlurView intensity={15} tint="dark" style={styles.statCard}>
              <Ionicons name="analytics" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Vidéos analysées</Text>
            </BlurView>

            <BlurView intensity={15} tint="dark" style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color={theme.colors.secondary} />
              <Text style={styles.statValue}>8.5</Text>
              <Text style={styles.statLabel}>Score moyen</Text>
            </BlurView>

            <BlurView intensity={15} tint="dark" style={styles.statCard}>
              <Ionicons name="time" size={24} color={theme.colors.accent} />
              <Text style={styles.statValue}>7j</Text>
              <Text style={styles.statLabel}>Dernière analyse</Text>
            </BlurView>
          </View>

          {/* Subscription Status */}
          <BlurView intensity={15} tint="dark" style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Ionicons name="diamond" size={24} color={theme.colors.warning} />
              <Text style={styles.subscriptionTitle}>Abonnement</Text>
            </View>
            <Text style={styles.subscriptionStatus}>Version Gratuite</Text>
            <Text style={styles.subscriptionDescription}>
              Passe à Viraly Pro pour débloquer toutes les fonctionnalités
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.upgradeButtonGradient}
              >
                <Text style={styles.upgradeButtonText}>Passer à Pro</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>

          {/* Application Settings */}
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>Application</Text>
            <GlassCard className="px-4 py-2">
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.settingText}>Notifications</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#1E1B3A', true: theme.colors.primary }}
                  thumbColor={notifications ? '#FFFFFF' : '#71717A'}
                />
              </View>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="moon-outline" size={20} color={theme.colors.secondary} />
                  </View>
                  <Text style={styles.settingText}>Mode Sombre</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#1E1B3A', true: theme.colors.secondary }}
                  thumbColor={darkMode ? '#FFFFFF' : '#71717A'}
                />
              </View>
            </GlassCard>
          </View>

          {/* Support Settings */}
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>Support</Text>
            <GlassCard className="px-4 py-2">
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="help-circle-outline" size={20} color={theme.colors.accent} />
                  </View>
                  <Text style={styles.settingText}>Centre d'aide</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="shield-outline" size={20} color={theme.colors.warning} />
                  </View>
                  <Text style={styles.settingText}>Confidentialité</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="phone-portrait-outline" size={20} color={theme.colors.text.secondary} />
                  </View>
                  <Text style={styles.settingText}>Version App v1.0.2</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* Danger Zone */}
          <View style={styles.settingsContainer}>
            <Text style={styles.dangerTitle}>Zone Critique</Text>
            <GlassCard variant="highlight" className="p-6">
              <Text style={styles.dangerSectionTitle}>Réinitialisation</Text>
              <Text style={styles.dangerDescription}>
                Si tu souhaites refaire le questionnaire d'onboarding ou recommencer à zéro, utilise cette option.
              </Text>
              
              <NeonButton
                title="RESET PROFIL & INTRO"
                onPress={handleResetProfile}
                fullWidth
              />

              <View style={{ height: 16 }} />

              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={16} color={theme.colors.error} style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>Se déconnecter</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>

          <Text style={styles.footerText}>
            Viraly AI - Build 2024.11.23
          </Text>
        </Animated.View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  profileType: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  profileGoal: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  subscriptionCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    overflow: 'hidden',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  subscriptionStatus: {
    fontSize: 16,
    color: theme.colors.warning,
    marginBottom: 8,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  upgradeButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  settingsContainer: {
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 8,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  dangerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.error,
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 12,
    marginTop: 32,
    marginBottom: 16,
  },
});

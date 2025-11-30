import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { logout } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
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

  const handleResetProfile = () => {
      Alert.alert(
      'Réinitialiser le profil',
      'Es-tu sûr de vouloir supprimer ton profil ? Tu devras refaire le questionnaire.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
            style: 'destructive',
          onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Reset profile logic here
          },
          },
        ]
      );
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Paywall');
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Es-tu sûr de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await logout();
              // La redirection vers Login se fait automatiquement via useAuth dans App.tsx
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la déconnexion');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[theme.colors.bg.primary, theme.colors.bg.secondary, theme.colors.bg.primary]}
      style={styles.container}
    >
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
            <Text style={styles.title}>Profil de Créateur</Text>
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

          {/* Settings */}
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>Paramètres</Text>
            
            <TouchableOpacity style={styles.settingItem}>
              <BlurView intensity={15} tint="dark" style={styles.settingCard}>
                <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.settingText}>Notifications</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <BlurView intensity={15} tint="dark" style={styles.settingCard}>
                <Ionicons name="shield-outline" size={20} color={theme.colors.secondary} />
                <Text style={styles.settingText}>Confidentialité</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <BlurView intensity={15} tint="dark" style={styles.settingCard}>
                <Ionicons name="help-circle-outline" size={20} color={theme.colors.accent} />
                <Text style={styles.settingText}>Aide & Support</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleResetProfile}>
              <BlurView intensity={15} tint="dark" style={styles.settingCard}>
                <Ionicons name="refresh-outline" size={20} color={theme.colors.error} />
                <Text style={styles.settingText}>Réinitialiser le profil</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <BlurView intensity={15} tint="dark" style={styles.settingCard}>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                <Text style={styles.settingText}>Se déconnecter</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
              </BlurView>
            </TouchableOpacity>
          </View>
        </Animated.View>
        </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
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
  profileEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
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
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 12,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
});








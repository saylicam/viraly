import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

interface PaywallScreenProps {
  navigation: any;
}

const FEATURES = [
  {
    icon: 'analytics',
    title: 'Analyses illimitées',
    description: 'Analyse autant de vidéos que tu veux avec l\'IA',
    gradient: ['#8b5cf6', '#a855f7'],
  },
  {
    icon: 'trending-up',
    title: 'Tendances en temps réel',
    description: 'Accès aux hashtags et sons les plus viraux du moment',
    gradient: ['#ec4899', '#f472b6'],
  },
  {
    icon: 'bulb',
    title: 'Conseils personnalisés',
    description: 'Recommandations adaptées à ton style de contenu',
    gradient: ['#f59e0b', '#fbbf24'],
  },
  {
    icon: 'stats-chart',
    title: 'Analytics avancés',
    description: 'Suis tes performances et optimise tes stratégies',
    gradient: ['#10b981', '#059669'],
  },
  {
    icon: 'rocket',
    title: 'Support prioritaire',
    description: 'Accès en priorité à notre équipe d\'experts',
    gradient: ['#ef4444', '#dc2626'],
  },
  {
    icon: 'diamond',
    title: 'Contenu exclusif',
    description: 'Tutoriels et guides réservés aux membres Pro',
    gradient: ['#8b5cf6', '#ec4899'],
  },
];

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate subscription process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Félicitations !',
        'Tu es maintenant membre Viraly Pro !',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de finaliser l\'abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
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
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Viraly Pro</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.heroIcon}
            >
              <Ionicons name="diamond" size={40} color="white" />
            </LinearGradient>
            
            <Text style={styles.heroTitle}>Débloque tout ton potentiel</Text>
            <Text style={styles.heroSubtitle}>
              Passe à Viraly Pro et maximise tes chances de devenir viral
            </Text>
          </View>

          {/* Pricing */}
          <BlurView intensity={20} tint="dark" style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <Text style={styles.pricingTitle}>Abonnement mensuel</Text>
              <View style={styles.pricingBadge}>
                <Text style={styles.pricingBadgeText}>Populaire</Text>
              </View>
            </View>
            
            <View style={styles.pricingAmount}>
              <Text style={styles.pricingCurrency}>€</Text>
              <Text style={styles.pricingValue}>9,99</Text>
              <Text style={styles.pricingPeriod}>/mois</Text>
            </View>
            
            <Text style={styles.pricingDescription}>
              Annule quand tu veux • Aucun engagement
            </Text>
          </BlurView>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Ce que tu obtiens :</Text>
            
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.feature}>
                <LinearGradient
                  colors={feature.gradient as [string, string]}
                  style={styles.featureIcon}
                >
                  <Ionicons name={feature.icon as any} size={20} color="white" />
                </LinearGradient>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isLoading ? [theme.colors.bg.tertiary, theme.colors.bg.tertiary] : theme.colors.gradient.primary}
              style={styles.subscribeButtonGradient}
            >
              {isLoading ? (
                <>
                  <Ionicons name="hourglass" size={20} color={theme.colors.text.secondary} />
                  <Text style={styles.subscribeButtonTextDisabled}>Traitement...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="diamond" size={20} color="white" />
                  <Text style={styles.subscribeButtonText}>Devenir Pro - 9,99€/mois</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            En t'abonnant, tu acceptes nos conditions d'utilisation et notre politique de confidentialité.
          </Text>
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
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pricingCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 12,
  },
  pricingBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pricingBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pricingAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  pricingCurrency: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  pricingValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  pricingPeriod: {
    fontSize: 18,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  pricingDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  subscribeButton: {
    marginBottom: 20,
  },
  subscribeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subscribeButtonTextDisabled: {
    color: theme.colors.text.secondary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  termsText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
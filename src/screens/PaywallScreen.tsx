import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Zap, Target, TrendingUp, BarChart3, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface PaywallScreenProps {
  navigation: any;
}

const BENEFITS = [
  {
    icon: Sparkles,
    title: 'Analyse IA illimitée',
    color: '#FF4FF9', // Rose néon
  },
  {
    icon: Zap,
    title: 'Score viral instantané',
    color: '#B371FF', // Violet clair néon
  },
  {
    icon: Target,
    title: 'Conseils personnalisés',
    color: '#5AC8FA', // Bleu néon
  },
  {
    icon: TrendingUp,
    title: 'Optimisations intelligentes',
    color: '#FFD84F', // Jaune néon
  },
  {
    icon: BarChart3,
    title: 'Timeline + Retention Map',
    color: '#42FFB0', // Vert néon
  },
];

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const ctaGlowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Animation glow pulsant pour l'icône
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();

    // Animation pulsation pour le CTA glow
    const ctaGlowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(ctaGlowAnim, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    ctaGlowAnimation.start();

    return () => {
      glowAnimation.stop();
      ctaGlowAnimation.stop();
    };
  }, []);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleActivatePremium = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // TODO: Intégrer RevenueCat ici
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlreadyPremium = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.3, 0.5],
  });

  const ctaGlowOpacity = ctaGlowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.2, 0.35],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0A0214', '#14052A', '#0A0214']}
        locations={[0, 0.5, 1]}
        style={styles.container}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Header avec bouton fermer */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={18} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Header Section avec halo lumineux */}
          <View style={styles.headerSection}>
            {/* Halo lumineux derrière l'icône */}
            <View style={styles.iconHaloContainer}>
              <View style={styles.iconHalo} />
            </View>

            {/* Icône ronde néon */}
            <Animated.View
              style={[
                styles.iconGlow,
                {
                  opacity: glowOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={['#C25CFF', '#FF4FF9', '#5AC8FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Sparkles size={24} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
            </Animated.View>

            {/* Titre */}
            <Text style={styles.title}>
              Viraly Premium <Text style={styles.sparkle}>✨</Text>
            </Text>

            {/* Highlight Bar */}
            <View style={styles.highlightBar}>
              <LinearGradient
                colors={['#C25CFF', '#FF4FF9', '#5AC8FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0, 0.5, 1]}
                style={styles.highlightBarGradient}
              />
            </View>

            {/* Sous-titre */}
            <Text style={styles.subtitle}>
              Débloque toute la puissance de l'Analyse IA
            </Text>
          </View>

          {/* Section Avantages - Cartes refaites */}
          <View style={styles.benefitsSection}>
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.88}
                  style={styles.benefitCard}
                >
                  {/* Bordure dégradé */}
                  <LinearGradient
                    colors={['#C25CFF', '#5AC8FA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.benefitBorder}
                  />
                  
                  <View style={styles.benefitContent}>
                    <View style={styles.benefitIconWrapper}>
                      <Icon size={22} color={benefit.color} strokeWidth={2.2} />
                    </View>
                    <Text style={styles.benefitText}>{benefit.title}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bloc Prix - Badge avec glow */}
          <View style={styles.pricingSection}>
            <View style={styles.pricingBadge}>
              <View style={styles.pricingGlow} />
              <Text style={styles.pricingText}>7,99 € / mois</Text>
            </View>
          </View>

          {/* Bouton CTA Premium refait */}
          <View style={styles.ctaWrapper}>
            <Animated.View
              style={[
                styles.ctaGlow,
                {
                  opacity: ctaGlowOpacity,
                },
              ]}
            />
            <TouchableOpacity
              onPress={handleActivatePremium}
              disabled={isLoading}
              activeOpacity={0.85}
              style={styles.ctaButton}
            >
              <LinearGradient
                colors={['#C25CFF', '#FF4FF9', '#5AC8FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0, 0.5, 1]}
                style={styles.ctaGradient}
              >
                {/* Inner shadow pour effet premium */}
                <View style={styles.ctaInnerShadow} />
                
                <View style={styles.ctaContent}>
                  <Sparkles size={28} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.ctaText}>
                    {isLoading ? 'Chargement...' : 'Activer Viraly Premium'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Lien secondaire */}
          <TouchableOpacity
            style={styles.alreadyPremiumButton}
            onPress={handleAlreadyPremium}
            activeOpacity={0.7}
          >
            <Text style={styles.alreadyPremiumText}>
              Déjà abonné ? Continuer
            </Text>
          </TouchableOpacity>

          {/* Mentions légales */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              Renouvellement automatique
            </Text>
            <Text style={styles.termsText}>
              Résiliation à tout moment dans les réglages
            </Text>
            <Text style={styles.termsText}>
              Le paiement est débité sur votre compte Apple
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0214',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(194, 92, 255, 0.15)',
  },
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  // Halo lumineux derrière l'icône
  iconHaloContainer: {
    position: 'absolute',
    top: -70,
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconHalo: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 79, 249, 0.18)',
  },
  iconGlow: {
    marginBottom: 8,
    shadowColor: '#C25CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.6,
    zIndex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: 8,
    textShadowColor: 'rgba(194, 92, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sparkle: {
    fontSize: 28,
  },
  // Highlight Bar
  highlightBar: {
    width: 160,
    height: 3,
    marginBottom: 8,
    borderRadius: 2,
    overflow: 'hidden',
    shadowColor: '#FF4FF9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  highlightBarGradient: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#B8B8C8',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  // Section Avantages - Cartes refaites
  benefitsSection: {
    marginBottom: 26,
  },
  benefitCard: {
    height: 54,
    marginBottom: 12,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: 'rgba(194, 92, 255, 0.35)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  benefitBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  benefitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 16,
  },
  benefitIconWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  // Bloc Prix - Badge avec glow
  pricingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
    overflow: 'visible',
  },
  pricingGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    backgroundColor: 'rgba(194, 92, 255, 0.35)',
    opacity: 0.4,
    zIndex: -1,
  },
  pricingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(194, 92, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // Bouton CTA Premium refait
  ctaWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  ctaGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: '#C25CFF',
    opacity: 0.25,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#C25CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  ctaGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  // Inner shadow pour effet premium
  ctaInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 1,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Lien secondaire
  alreadyPremiumButton: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  alreadyPremiumText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  // Mentions légales
  termsSection: {
    alignItems: 'center',
    paddingTop: 4,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 3,
    fontWeight: '400',
  },
});

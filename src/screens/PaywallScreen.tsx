import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, SafeAreaView, Dimensions, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Zap, Target, TrendingUp, BarChart3, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRevenueCat } from '../context/RevenueCatContext';

const { width } = Dimensions.get('window');

// Liens légaux affichés sous le bouton d'achat (exigés par Apple pour les abonnements)
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
// TODO: remplacer par l'URL de ta politique de confidentialité avant la soumission à Apple
const PRIVACY_URL = 'https://viraly.app/confidentialite';

type PlanKey = 'annual' | 'monthly';

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
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('annual');
  const {
    monthlyPackage,
    annualPackage,
    monthlyPrice,
    annualPrice,
    purchasePackage,
    restorePurchases,
    isPremium,
    isLoading: revenueCatLoading,
  } = useRevenueCat();

  const selectedPackage = selectedPlan === 'annual' ? (annualPackage ?? monthlyPackage) : (monthlyPackage ?? annualPackage);
  const hasFreeTrial = !!selectedPackage?.product.introPrice && selectedPackage.product.introPrice.price === 0;

  // Réduction de l'annuel par rapport à 12 mois de mensuel (ex : -48 %)
  const annualSavings = (() => {
    const m = monthlyPackage?.product.price;
    const a = annualPackage?.product.price;
    if (!m || !a) return null;
    const pct = Math.round((1 - a / (m * 12)) * 100);
    return pct > 0 ? pct : null;
  })();
  const annualPerMonth = annualPackage
    ? `${(annualPackage.product.price / 12).toFixed(2).replace('.', ',')} ${annualPackage.product.currencyCode === 'EUR' ? '€' : annualPackage.product.currencyCode}`
    : null;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const ctaGlowAnim = useRef(new Animated.Value(0.5)).current;

  // Vérifier si l'utilisateur est déjà premium et rediriger
  useEffect(() => {
    if (isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    }
  }, [isPremium, navigation]);

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
    if (!selectedPackage) {
      Alert.alert(
        'Abonnement indisponible',
        "L'abonnement n'est pas disponible pour le moment. Vérifie ta connexion et réessaie.",
        [{ text: 'OK' }]
      );
      return;
    }
    if (isLoading || revenueCatLoading) return;

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const premium = await purchasePackage(selectedPackage);
      if (premium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      }
      // premium === false : l'utilisateur a annulé, on ne fait rien
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "L'achat n'a pas abouti",
        error?.message || 'Une erreur est survenue lors de l\'achat. Réessaie.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlreadyPremium = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      setIsLoading(true);
      const restored = await restorePurchases();

      if (restored) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } else {
        Alert.alert(
          'Aucun achat trouvé',
          'Aucun abonnement actif n\'a été trouvé sur votre compte.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la restauration. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
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
        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
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

          {/* Choix de la formule */}
          <View style={styles.plansRow}>
            {([
              {
                key: 'annual' as PlanKey,
                label: 'Annuel',
                price: annualPrice ?? '49,99 €',
                period: '/ an',
                sub: annualPerMonth ? `soit ${annualPerMonth} / mois` : null,
                badge: annualSavings ? `-${annualSavings} %` : 'Meilleure offre',
              },
              {
                key: 'monthly' as PlanKey,
                label: 'Mensuel',
                price: monthlyPrice ?? '7,99 €',
                period: '/ mois',
                sub: 'Sans engagement',
                badge: null,
              },
            ]).map((plan) => {
              const selected = selectedPlan === plan.key;
              return (
                <TouchableOpacity
                  key={plan.key}
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedPlan(plan.key);
                  }}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                >
                  {plan.badge && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <Text style={styles.planLabel}>{plan.label}</Text>
                  <Text style={styles.planPrice}>
                    {revenueCatLoading ? '…' : plan.price}
                    <Text style={styles.planPeriod}> {plan.period}</Text>
                  </Text>
                  {plan.sub && <Text style={styles.planSub}>{plan.sub}</Text>}
                </TouchableOpacity>
              );
            })}
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
              pointerEvents="none"
            />
            <TouchableOpacity
              onPress={handleActivatePremium}
              disabled={isLoading || revenueCatLoading || !selectedPackage}
              activeOpacity={0.85}
              style={[
                styles.ctaButton,
                (isLoading || revenueCatLoading || !selectedPackage) && styles.ctaButtonDisabled
              ]}
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
                    {isLoading || revenueCatLoading ? 'Chargement...' : hasFreeTrial ? 'Essayer 3 jours gratuits' : 'Activer Viraly Premium'}
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
              Restaurer mes achats
            </Text>
          </TouchableOpacity>

          {/* Mentions légales (exigées par Apple) */}
          <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              {hasFreeTrial
                ? `3 jours gratuits, puis ${selectedPlan === 'annual' ? `${annualPrice ?? '49,99 €'} par an` : `${monthlyPrice ?? '7,99 €'} par mois`}.`
                : `${selectedPlan === 'annual' ? `${annualPrice ?? '49,99 €'} par an` : `${monthlyPrice ?? '7,99 €'} par mois`}.`}
            </Text>
            <Text style={styles.termsText}>
              Renouvellement automatique, résiliable à tout moment dans les réglages de ton compte Apple au moins 24 h avant la fin de la période.
            </Text>
            <View style={styles.legalLinks}>
              <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
                Conditions d'utilisation
              </Text>
              <Text style={styles.termsText}>  ·  </Text>
              <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
                Confidentialité
              </Text>
            </View>
          </View>
        </Animated.ScrollView>
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
    flexGrow: 1,
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
    zIndex: 0,
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
    zIndex: 10,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
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
  // Choix de la formule
  plansRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  planCardSelected: {
    borderColor: '#C25CFF',
    backgroundColor: 'rgba(194, 92, 255, 0.14)',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FF4FF9',
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  planSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  legalLink: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'underline',
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

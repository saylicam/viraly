import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { ScreenBackground } from '../components/ui/ScreenBackground';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

const FEATURES = [
  {
    icon: 'sparkles',
    title: 'Analyse IA',
    description: 'Gemini analyse tes vidéos en profondeur',
    gradient: ['#8F5BFF', '#D946EF'],
  },
  {
    icon: 'trending-up',
    title: 'Tendances',
    description: 'Hashtags et sons du moment en temps réel',
    gradient: ['#D946EF', '#8F5BFF'],
  },
  {
    icon: 'calendar-outline',
    title: 'Calendrier',
    description: 'Planning intelligent selon ta niche',
    gradient: ['#8F5BFF', '#6EE7FF'],
  },
];

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const [showScrollHint, setShowScrollHint] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Cacher le hint après 3 secondes
    setTimeout(() => {
      setShowScrollHint(false);
    }, 3000);
  }, []);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Questionnaire');
  };

  // Animation du hint de scroll
  const scrollHintAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showScrollHint) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scrollHintAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scrollHintAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showScrollHint]);

  const scrollHintTranslateY = scrollHintAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  // Gradient fade en bas pour inciter au scroll
  const gradientOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <ScreenBackground variant="minimal">
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bienvenue sur</Text>
            <Text style={styles.brandTitle}>Viraly</Text>
            <Text style={styles.subtitle}>
              Ton coach IA pour créer du contenu viral sur TikTok & Instagram
            </Text>
          </View>

          {/* Features Grid - COMPACT */}
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.85}
                style={styles.cardTouchable}
              >
                <BlurView intensity={20} tint="dark" style={styles.featureCard}>
                  <LinearGradient
                    colors={feature.gradient}
                    style={styles.featureIcon}
                  >
                    <Ionicons name={feature.icon as any} size={20} color="white" />
                  </LinearGradient>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>

          {/* Scroll Hint */}
          {showScrollHint && (
            <Animated.View
              style={[
                styles.scrollHint,
                {
                  opacity: scrollHintAnim,
                  transform: [{ translateY: scrollHintTranslateY }],
                }
              ]}
            >
              <Text style={styles.scrollHintText}>↓ Continue</Text>
            </Animated.View>
          )}

          {/* CTA Section - COMPACT */}
          <View style={styles.ctaSection}>
            <BlurView intensity={25} tint="dark" style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Prêt à devenir viral ?</Text>
              <Text style={styles.ctaDescription}>
                Commence par remplir notre questionnaire pour personnaliser ton expérience
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleGetStarted}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#8F5BFF', '#D946EF']}
                  style={styles.ctaButtonGradient}
                >
                  <Text style={styles.ctaButtonText}>Commencer l'aventure</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Gradient fade en bas pour inciter au scroll */}
      <Animated.View
        style={[
          styles.bottomGradient,
          { opacity: gradientOpacity }
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['transparent', 'rgba(15, 5, 29, 0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24, // 24px horizontal
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32, // Réduit de 48
  },
  title: {
    fontSize: 22, // Réduit de 24
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  brandTitle: {
    fontSize: 48, // Réduit de 52
    fontWeight: '900',
    color: '#8F5BFF', // Violet premium
    textAlign: 'center',
    marginVertical: 6, // Réduit
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15, // Réduit de 16
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
  featuresGrid: {
    marginBottom: 24, // Réduit de 48
  },
  cardTouchable: {
    marginBottom: 12, // Réduit de 16
  },
  featureCard: {
    borderRadius: 24, // rounded-3xl
    padding: 18, // Réduit de 24
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)', // Plus fin
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#8F5BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIcon: {
    width: 48, // Réduit de 60
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12, // Réduit de 16
  },
  featureTitle: {
    fontSize: 18, // Réduit de 20
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6, // Réduit de 8
  },
  featureDescription: {
    fontSize: 14, // Réduit de 16
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  scrollHint: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollHintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  ctaSection: {
    marginTop: 8,
  },
  ctaCard: {
    borderRadius: 24,
    padding: 24, // Réduit de 32
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#8F5BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaTitle: {
    fontSize: 22, // Réduit de 24
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 10, // Réduit de 12
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 14, // Réduit de 16
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20, // Réduit de 24
  },
  ctaButton: {
    width: '100%',
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, // Réduit de 18
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: '#8F5BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16, // Réduit de 18
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    pointerEvents: 'none',
  },
});

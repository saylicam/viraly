import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Sparkles, TrendingUp, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ScreenBackground } from '../components/ui/ScreenBackground';
import { NeonButton } from '../components/ui/NeonButton';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Analyse IA',
    description: 'Gemini analyse tes vidéos en profondeur',
    gradient: ['#7B33F7', '#FF4FF9'], // Violet / fuchsia
  },
  {
    icon: TrendingUp,
    title: 'Tendances',
    description: 'Hashtags et sons du moment en temps réel',
    gradient: ['#FF4FF9', '#FF5DF5'], // Rose / magenta
  },
  {
    icon: Calendar,
    title: 'Calendrier',
    description: 'Planning intelligent selon ta niche',
    gradient: ['#4FC3FF', '#B371FF'], // Bleu / violet clair
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

    setTimeout(() => {
      setShowScrollHint(false);
    }, 3000);
  }, []);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Questionnaire');
  };

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

  const gradientOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Fond gradient premium mauve-bleuté */}
      <LinearGradient
        colors={['#0E001A', '#150027', '#1B0033']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Halos / Blobs subtils pour profondeur */}
      <View style={styles.blobsContainer}>
        <View style={[styles.blob1, { backgroundColor: 'rgba(123, 51, 247, 0.12)' }]} />
        <View style={[styles.blob2, { backgroundColor: 'rgba(79, 195, 255, 0.1)' }]} />
      </View>

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

          {/* Features Grid - Style premium compact */}
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.85}
                  style={styles.cardTouchable}
                >
                  <View style={styles.featureCard}>
                    <View style={styles.featureCardBackground} />
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.06)']}
                      style={styles.featureCardGradient}
                    >
                      <View style={styles.featureIconContainer}>
                        <LinearGradient
                          colors={feature.gradient}
                          style={styles.featureIcon}
                        >
                          <Icon size={24} color="white" strokeWidth={2.5} />
                        </LinearGradient>
                      </View>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              );
            })}
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

          {/* CTA Section - Style premium compact */}
          <View style={styles.ctaSection}>
            <View style={styles.ctaCard}>
              <View style={styles.ctaCardBackground} />
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.06)']}
                style={styles.ctaCardGradient}
              >
                <View style={styles.ctaIconContainer}>
                  <LinearGradient
                    colors={['#FF4FF9', '#7B33F7']} // Rose / violet vif
                    style={styles.ctaIcon}
                  >
                    <Ionicons name="rocket" size={26} color="white" />
                  </LinearGradient>
                </View>
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
                    colors={['#7B33F7', '#FF4FF9']} // Violet → rose néon
                    style={styles.ctaButtonGradient}
                  >
                    <Text style={styles.ctaButtonText}>Commencer l'aventure</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Gradient fade en bas */}
      <Animated.View
        style={[
          styles.bottomGradient,
          { opacity: gradientOpacity }
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['transparent', 'rgba(14, 0, 26, 0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E001A',
  },
  blobsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    top: -100,
    right: -100,
    opacity: 0.12,
  },
  blob2: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    bottom: -50,
    left: -50,
    opacity: 0.1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 6,
    letterSpacing: 1.5,
    color: '#B371FF',
    textShadowColor: 'rgba(179, 113, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#EAEAEA',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginTop: 6,
    opacity: 0.85,
  },
  featuresGrid: {
    marginBottom: 24,
  },
  cardTouchable: {
    marginBottom: 12,
  },
  featureCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 255, 0.35)',
    shadowColor: '#7B33F7',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    position: 'relative',
  },
  featureCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  featureCardGradient: {
    padding: 16,
  },
  featureIconContainer: {
    marginBottom: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B371FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#EAEAEA',
    lineHeight: 18,
    opacity: 0.8,
  },
  scrollHint: {
    alignItems: 'center',
    marginBottom: 12,
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
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 255, 0.35)',
    shadowColor: '#7B33F7',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    position: 'relative',
  },
  ctaCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  ctaCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  ctaIconContainer: {
    marginBottom: 16,
  },
  ctaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4FF9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  ctaDescription: {
    fontSize: 13,
    color: '#EAEAEA',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 12,
    opacity: 0.8,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#7B33F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.3,
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

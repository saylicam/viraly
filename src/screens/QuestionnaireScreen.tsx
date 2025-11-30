import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { ScreenBackground } from '../components/ui/ScreenBackground';
import { NeonButton } from '../components/ui/NeonButton';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');

interface QuestionnaireScreenProps {
  navigation: any;
}

interface Step {
  key: string;
  title: string;
  subtitle?: string;
  multi?: boolean;
  options: { key: string; label: string; icon?: keyof typeof Ionicons.glyphMap; sub?: string; gradient?: string[] }[];
}

const STEPS: Step[] = [
  {
    key: 'level',
    title: "Quel est ton niveau d'expérience ?",
    subtitle: 'Aide-nous à personnaliser ton coaching',
    options: [
      { 
        key: 'beginner', 
        label: 'Débutant·e', 
        icon: 'phone-portrait-outline', 
        sub: 'Je débute',
        gradient: ['#8F5BFF', '#D946EF'],
      },
      { 
        key: 'intermediate', 
        label: 'Intermédiaire', 
        icon: 'camera-outline', 
        sub: 'Moins de 10K vues',
        gradient: ['#D946EF', '#8F5BFF'],
      },
      { 
        key: 'advanced', 
        label: 'Avancé·e', 
        icon: 'videocam-outline', 
        sub: '10K à 50K vues',
        gradient: ['#8F5BFF', '#6EE7FF'],
      },
      { 
        key: 'pro', 
        label: 'Pro', 
        icon: 'trophy-outline', 
        sub: 'Plus de 50K vues',
        gradient: ['#6EE7FF', '#8F5BFF'],
      },
    ],
  },
  {
    key: 'frequency',
    title: 'À quelle fréquence publies-tu ?',
    subtitle: 'Pour calibrer ton calendrier intelligent',
    options: [
      { key: '1week', label: '1 fois par semaine', icon: 'calendar-outline', gradient: ['#8F5BFF', '#D946EF'] },
      { key: '2week', label: '2 à 3 fois par semaine', icon: 'calendar-outline', gradient: ['#D946EF', '#8F5BFF'] },
      { key: 'daily', label: 'Tous les jours', icon: 'calendar-outline', gradient: ['#8F5BFF', '#6EE7FF'] },
      { key: 'irregular', label: 'Irrégulièrement', icon: 'calendar-outline', gradient: ['#6EE7FF', '#8F5BFF'] },
    ],
  },
  {
    key: 'niches',
    title: 'Quel est ton type de contenu ?',
    subtitle: 'Choisis tes niches principales',
    multi: true,
    options: [
      { key: 'comedy', label: 'Comédie', icon: 'happy-outline', gradient: ['#8F5BFF', '#D946EF'] },
      { key: 'music', label: 'Musique', icon: 'musical-notes-outline', gradient: ['#D946EF', '#8F5BFF'] },
      { key: 'beauty', label: 'Beauté', icon: 'sparkles-outline', gradient: ['#8F5BFF', '#6EE7FF'] },
      { key: 'education', label: 'Éducation', icon: 'school-outline', gradient: ['#6EE7FF', '#8F5BFF'] },
      { key: 'gaming', label: 'Gaming', icon: 'game-controller-outline', gradient: ['#8F5BFF', '#D946EF'] },
      { key: 'fitness', label: 'Fitness', icon: 'fitness-outline', gradient: ['#D946EF', '#8F5BFF'] },
      { key: 'tech', label: 'Tech', icon: 'hardware-chip-outline', gradient: ['#8F5BFF', '#6EE7FF'] },
      { key: 'food', label: 'Cuisine', icon: 'restaurant-outline', gradient: ['#6EE7FF', '#8F5BFF'] },
      { key: 'travel', label: 'Voyages', icon: 'airplane-outline', gradient: ['#8F5BFF', '#D946EF'] },
    ],
  },
  {
    key: 'goal',
    title: 'Quel est ton objectif principal ?',
    subtitle: 'Ce qui te motive le plus',
    options: [
      { key: 'views', label: 'Augmenter mes vues', icon: 'eye-outline', sub: 'Plus de visibilité', gradient: ['#8F5BFF', '#D946EF'] },
      { key: 'engagement', label: "Booster l'engagement", icon: 'heart-outline', sub: "Plus d'interactions", gradient: ['#D946EF', '#8F5BFF'] },
      { key: 'fanbase', label: 'Construire ma communauté', icon: 'people-outline', sub: 'Plus de followers', gradient: ['#8F5BFF', '#6EE7FF'] },
      { key: 'monetization', label: 'Monétiser mon contenu', icon: 'cash-outline', sub: 'Générer des revenus', gradient: ['#6EE7FF', '#8F5BFF'] },
    ],
  },
];

export default function QuestionnaireScreen({ navigation }: QuestionnaireScreenProps) {
  const { user } = useAuth(); // Vérifier si user est connecté
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollHintAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation du hint de scroll
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

    // Cacher le hint après scroll
    const listener = scrollY.addListener(({ value }) => {
      if (value > 50) {
        setShowScrollHint(false);
      }
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [currentStep]);

  const handleOptionSelect = (stepKey: string, optionKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const step = STEPS.find(s => s.key === stepKey);
    if (!step) return;

    if (step.multi) {
      setAnswers(prev => ({
        ...prev,
        [stepKey]: prev[stepKey]?.includes(optionKey)
          ? prev[stepKey].filter(key => key !== optionKey)
          : [...(prev[stepKey] || []), optionKey]
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [stepKey]: [optionKey]
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setShowScrollHint(true);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Rediriger vers Calculating (écran de génération du plan)
    // Calculating redirigera automatiquement vers Recommendation
    navigation.navigate('Calculating', { answers });
  };

  const currentStepData = STEPS[currentStep];
  const isStepComplete = answers[currentStepData.key]?.length > 0;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Gradient fade en bas
  const gradientOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const scrollHintTranslateY = scrollHintAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  return (
    <ScreenBackground variant="minimal">
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Étape {currentStep + 1} / {STEPS.length}
        </Text>
      </View>

      <ScrollView
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>{currentStepData.title}</Text>
            {currentStepData.subtitle && (
              <Text style={styles.questionSubtitle}>{currentStepData.subtitle}</Text>
            )}
          </View>

          {/* Options - Cartes COMPACTES */}
          <View style={styles.optionsContainer}>
            {currentStepData.options.map((option, index) => {
              const isSelected = answers[currentStepData.key]?.includes(option.key);
              const gradient = option.gradient || ['#8F5BFF', '#D946EF'];
              
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.85}
                  onPress={() => handleOptionSelect(currentStepData.key, option.key)}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                >
                  <BlurView intensity={20} tint="dark" style={styles.optionCardBlur}>
                    {option.icon && (
                      <LinearGradient
                        colors={gradient}
                        style={styles.optionIcon}
                      >
                        <Ionicons
                          name={option.icon}
                          size={18} // Réduit de 24
                          color="white"
                        />
                      </LinearGradient>
                    )}
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected
                      ]}>
                        {option.label}
                      </Text>
                      {option.sub && (
                        <Text style={[
                          styles.optionSub,
                          isSelected && styles.optionSubSelected
                        ]}>
                          {option.sub}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={22} // Réduit de 28
                          color={gradient[0]}
                        />
                      </View>
                    )}
                  </BlurView>
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
              <ChevronDown size={16} color="rgba(255, 255, 255, 0.5)" />
            </Animated.View>
          )}

          {/* Spacer pour le bouton sticky */}
          <View style={{ height: 100 }} />
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
          colors={['transparent', 'rgba(15, 5, 29, 0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Bouton Sticky en bas */}
      <View style={styles.stickyButtonContainer}>
        <BlurView intensity={30} tint="dark" style={styles.stickyButtonBlur}>
          <NeonButton
            title={isLoading ? 'Chargement...' : currentStep === STEPS.length - 1 ? 'Terminer' : 'Continuer'}
            onPress={handleNext}
            size="large"
            fullWidth
            disabled={!isStepComplete || isLoading}
          />
        </BlurView>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16, // Réduit de 20
  },
  progressBar: {
    height: 4, // Réduit de 6
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    marginBottom: 8, // Réduit de 12
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8F5BFF',
    borderRadius: 2,
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 13, // Réduit de 14
    textAlign: 'right',
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Espace pour le bouton sticky
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  questionContainer: {
    marginBottom: 24, // Réduit de 32
  },
  questionTitle: {
    fontSize: 26, // Réduit de 28
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8, // Réduit de 12
    textAlign: 'center',
    lineHeight: 34,
  },
  questionSubtitle: {
    fontSize: 15, // Réduit de 16
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
    gap: 12, // Réduit de 16
    marginBottom: 24,
  },
  optionCard: {
    marginBottom: 0,
  },
  optionCardSelected: {
    borderWidth: 1.5, // Plus fin
    borderColor: '#8F5BFF',
    borderRadius: 24,
  },
  optionCardBlur: {
    borderRadius: 24,
    padding: 16, // Réduit de 20
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 40, // Réduit de 48
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14, // Réduit de 16
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16, // Réduit de 18
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3, // Réduit de 4
  },
  optionLabelSelected: {
    color: '#8F5BFF',
  },
  optionSub: {
    fontSize: 13, // Réduit de 14
    color: '#94A3B8',
  },
  optionSubSelected: {
    color: '#A78BFA',
  },
  checkmarkContainer: {
    marginLeft: 10, // Réduit de 12
  },
  scrollHint: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    height: 100,
    pointerEvents: 'none',
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 12,
  },
  stickyButtonBlur: {
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 5, 29, 0.8)',
  },
});

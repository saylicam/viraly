import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
  options: { 
    key: string; 
    label: string; 
    icon?: keyof typeof Ionicons.glyphMap; 
    sub?: string; 
    gradient?: string[];
  }[];
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
        gradient: ['#7B33F7', '#FF4FF9'], // Violet / fuchsia
      },
      { 
        key: 'intermediate', 
        label: 'Intermédiaire', 
        icon: 'camera-outline', 
        sub: 'Moins de 10K vues',
        gradient: ['#FF4FF9', '#B371FF'], // Rose / violet clair
      },
      { 
        key: 'advanced', 
        label: 'Avancé·e', 
        icon: 'videocam-outline', 
        sub: '10K à 50K vues',
        gradient: ['#4FC3FF', '#7B33F7'], // Bleu / violet
      },
      { 
        key: 'pro', 
        label: 'Pro', 
        icon: 'trophy-outline', 
        sub: 'Plus de 50K vues',
        gradient: ['#FF4FF9', '#FF5DF5'], // Rose / magenta
      },
    ],
  },
  {
    key: 'frequency',
    title: 'À quelle fréquence publies-tu ?',
    subtitle: 'Pour calibrer ton calendrier intelligent',
    options: [
      { 
        key: '1week', 
        label: '1 fois par semaine', 
        icon: 'calendar-outline',
        gradient: ['#7B33F7', '#FF4FF9'],
      },
      { 
        key: '2week', 
        label: '2 à 3 fois par semaine', 
        icon: 'calendar-outline',
        gradient: ['#FF4FF9', '#B371FF'],
      },
      { 
        key: 'daily', 
        label: 'Tous les jours', 
        icon: 'calendar-outline',
        gradient: ['#4FC3FF', '#7B33F7'],
      },
      { 
        key: 'irregular', 
        label: 'Irrégulièrement', 
        icon: 'calendar-outline',
        gradient: ['#B371FF', '#FF4FF9'],
      },
    ],
  },
  {
    key: 'niches',
    title: 'Quel est ton type de contenu ?',
    subtitle: 'Choisis tes niches principales',
    multi: true,
    options: [
      { 
        key: 'comedy', 
        label: 'Comédie', 
        icon: 'happy-outline',
        gradient: ['#7B33F7', '#FF4FF9'],
      },
      { 
        key: 'music', 
        label: 'Musique', 
        icon: 'musical-notes-outline',
        gradient: ['#FF4FF9', '#B371FF'],
      },
      { 
        key: 'beauty', 
        label: 'Beauté', 
        icon: 'sparkles-outline',
        gradient: ['#4FC3FF', '#7B33F7'],
      },
      { 
        key: 'education', 
        label: 'Éducation', 
        icon: 'school-outline',
        gradient: ['#FF4FF9', '#FF5DF5'],
      },
      { 
        key: 'gaming', 
        label: 'Gaming', 
        icon: 'game-controller-outline',
        gradient: ['#7B33F7', '#B371FF'],
      },
      { 
        key: 'fitness', 
        label: 'Fitness', 
        icon: 'fitness-outline',
        gradient: ['#4FC3FF', '#FF4FF9'],
      },
      { 
        key: 'tech', 
        label: 'Tech', 
        icon: 'hardware-chip-outline',
        gradient: ['#B371FF', '#7B33F7'],
      },
      { 
        key: 'food', 
        label: 'Cuisine', 
        icon: 'restaurant-outline',
        gradient: ['#FF4FF9', '#B371FF'],
      },
      { 
        key: 'travel', 
        label: 'Voyages', 
        icon: 'airplane-outline',
        gradient: ['#4FC3FF', '#B371FF'],
      },
    ],
  },
  {
    key: 'goal',
    title: 'Quel est ton objectif principal ?',
    subtitle: 'Ce qui te motive le plus',
    options: [
      { 
        key: 'views', 
        label: 'Augmenter mes vues', 
        icon: 'eye-outline', 
        sub: 'Plus de visibilité',
        gradient: ['#7B33F7', '#FF4FF9'],
      },
      { 
        key: 'engagement', 
        label: "Booster l'engagement", 
        icon: 'heart-outline', 
        sub: "Plus d'interactions",
        gradient: ['#FF4FF9', '#B371FF'],
      },
      { 
        key: 'fanbase', 
        label: 'Construire ma communauté', 
        icon: 'people-outline', 
        sub: 'Plus de followers',
        gradient: ['#4FC3FF', '#7B33F7'],
      },
      { 
        key: 'monetization', 
        label: 'Monétiser mon contenu', 
        icon: 'cash-outline', 
        sub: 'Générer des revenus',
        gradient: ['#FF4FF9', '#FF5DF5'],
      },
    ],
  },
];

export default function QuestionnaireScreen({ navigation }: QuestionnaireScreenProps) {
  const { user } = useAuth();
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
    
    navigation.navigate('Calculating', { answers });
  };

  const currentStepData = STEPS[currentStep];
  const isStepComplete = answers[currentStepData.key]?.length > 0;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

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
        fadingEdgeLength={0}
        overScrollMode="never"
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

          {/* Options - Cartes premium compactes */}
          <View style={styles.optionsContainer}>
            {currentStepData.options.map((option, index) => {
              const isSelected = answers[currentStepData.key]?.includes(option.key);
              const gradient = option.gradient || ['#7B33F7', '#FF4FF9'];
              
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.85}
                  onPress={() => handleOptionSelect(currentStepData.key, option.key)}
                  style={styles.optionCardWrapper}
                >
                  <View style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}>
                    <View style={styles.optionCardBackground} />
                    <LinearGradient
                      colors={isSelected 
                        ? ['rgba(123, 51, 247, 0.15)', 'rgba(255, 79, 249, 0.1)']
                        : ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.06)']
                      }
                      style={styles.optionCardGradient}
                    >
                      {option.icon && (
                        <View style={styles.optionIconContainer}>
                          <LinearGradient
                            colors={gradient}
                            style={styles.optionIcon}
                          >
                            <Ionicons
                              name={option.icon}
                              size={22}
                              color="white"
                            />
                          </LinearGradient>
                        </View>
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
                          <LinearGradient
                            colors={gradient}
                            style={styles.checkmarkGradient}
                          >
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                          </LinearGradient>
                        </View>
                      )}
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
              <ChevronDown size={16} color="rgba(255, 255, 255, 0.5)" />
            </Animated.View>
          )}

          {/* Spacer pour le bouton sticky */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Bouton Sticky en bas - Style premium néon - Zone fixe sans overlay */}
      <View style={styles.stickyButtonContainer}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!isStepComplete || isLoading}
          activeOpacity={0.85}
          style={styles.stickyButtonTouchable}
        >
          <LinearGradient
            colors={['#7B33F7', '#FF4FF9']}
            style={styles.stickyButtonGradient}
          >
            <Text style={styles.stickyButtonText}>
              {isLoading ? 'Chargement...' : currentStep === STEPS.length - 1 ? 'Terminer' : 'Continuer'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  progressContainer: {
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 16,
    zIndex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#B371FF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressText: {
    color: '#EAEAEA',
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '600',
    opacity: 0.8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#EAEAEA',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.85,
  },
  optionsContainer: {
    flex: 1,
    gap: 12,
    marginBottom: 20,
  },
  optionCardWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  optionCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(179, 113, 255, 0.35)',
    shadowColor: '#7B33F7',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    position: 'relative',
  },
  optionCardSelected: {
    borderWidth: 1.4,
    borderColor: 'rgba(179, 113, 255, 0.6)',
    shadowColor: '#B371FF',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  optionCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  optionCardGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    marginRight: 14,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B371FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#B371FF',
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 12,
    color: '#EAEAEA',
    opacity: 0.7,
  },
  optionSubSelected: {
    color: '#FF4FF9',
    opacity: 0.9,
  },
  checkmarkContainer: {
    marginLeft: 10,
  },
  checkmarkGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B371FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollHint: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  stickyButtonTouchable: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  stickyButtonGradient: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B33F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  stickyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

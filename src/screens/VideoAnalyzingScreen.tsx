import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Alert, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import AnimatedBackground from '../components/AnimatedBackground';
import { apiService } from '../services/api';
import { useRevenueCat } from '../context/RevenueCatContext';

const { width, height } = Dimensions.get('window');

interface VideoAnalyzingScreenProps {
  navigation: any;
  route: {
    params: {
      videoUri: string;
    };
  };
}

const ANALYSIS_STEPS = [
  { 
    text: 'Analyse du contenu visuel...', 
    icon: 'eye', 
    color: '#8B5CF6', 
    glow: '#A855F7',
    description: 'Détection des scènes, objets et éléments visuels'
  },
  { 
    text: 'Analyse du rythme et du tempo...', 
    icon: 'pulse', 
    color: '#EC4899', 
    glow: '#F472B6',
    description: 'Évaluation du rythme et de la structure narrative'
  },
  { 
    text: 'Détection des émotions...', 
    icon: 'heart', 
    color: '#F59E0B', 
    glow: '#FBBF24',
    description: 'Identification du ton et des émotions transmises'
  },
  { 
    text: 'Analyse du potentiel viral...', 
    icon: 'rocket', 
    color: '#10B981', 
    glow: '#34D399',
    description: 'Calcul du score viral et des opportunités'
  },
  { 
    text: 'Optimisation IA en cours...', 
    icon: 'sparkles', 
    color: theme.colors.primary, 
    glow: '#EC4899',
    description: 'Génération des recommandations personnalisées'
  },
];

export default function VideoAnalyzingScreen({ navigation, route }: VideoAnalyzingScreenProps) {
  const { isPremium, syncPurchases } = useRevenueCat();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  // Pourcentage affiché = exactement la position de la barre
  const [percent, setPercent] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Références pour les animations de chaque étape
  const stepAnims = useRef(
    ANALYSIS_STEPS.map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
      checkScale: new Animated.Value(0),
      glow: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Animation d'entrée globale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de rotation continue du logo
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    // Barre de progression : avance vite au début puis ralentit, et s'arrête à 95 %
    // tant que le serveur n'a pas répondu (elle passe à 100 % à la fin réelle de l'analyse).
    const progressListener = progressAnim.addListener(({ value }) => {
      setPercent(Math.round(value * 100));
    });
    Animated.timing(progressAnim, {
      toValue: 0.95,
      duration: 40000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Animation du glow global
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();

    return () => {
      rotateAnimation.stop();
      glowAnimation.stop();
      progressAnim.removeListener(progressListener);
    };
  }, []);

  useEffect(() => {
    // Animer chaque étape lorsqu'elle devient active
    if (currentStep < ANALYSIS_STEPS.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Animated.parallel([
        Animated.timing(stepAnims[currentStep].opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(stepAnims[currentStep].scale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation du glow pour l'étape active
      Animated.loop(
        Animated.sequence([
          Animated.timing(stepAnims[currentStep].glow, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(stepAnims[currentStep].glow, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Marquer l'étape précédente comme complétée
      if (currentStep > 0) {
        setCompletedSteps(prev => [...prev, currentStep - 1]);
        Animated.spring(stepAnims[currentStep - 1].checkScale, {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [currentStep]);

  // Animation cosmétique des étapes (tant que l'API n'a pas répondu)
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 2500);

    return () => {
      clearInterval(stepInterval);
    };
  }, []);

  // Vrai appel API Gemini via le backend
  useEffect(() => {
    const videoUri = route.params?.videoUri;
    if (!videoUri) {
      Alert.alert('Erreur', 'Aucune vidéo à analyser.');
      if (navigation.canGoBack()) navigation.goBack();
      return;
    }

    let cancelled = false;

    const runAnalysis = async () => {
      try {
        console.log('🎬 Démarrage analyse vidéo:', videoUri);

        const healthCheck = await apiService.healthCheck();
        if (cancelled) return;

        if (!healthCheck.success) {
          throw new Error(
            'Serveur inaccessible. Vérifie ta connexion internet et réessaie.'
          );
        }

        let response = await apiService.uploadVideo(videoUri);

        // L'app voit un abonnement mais le serveur non : on renvoie le reçu Apple
        // à RevenueCat pour ce compte, puis on réessaie une fois.
        if (!response.success && response.code === 'FREE_LIMIT_REACHED' && isPremium) {
          const premiumAfterSync = await syncPurchases();
          if (cancelled) return;
          if (premiumAfterSync) {
            response = await apiService.uploadVideo(videoUri);
          }
        }
        if (cancelled) return;

        // Limite gratuite atteinte : on propose Premium
        if (!response.success && response.code === 'FREE_LIMIT_REACHED') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert('Analyses gratuites épuisées', response.error || '', [
            { text: 'Plus tard', style: 'cancel', onPress: () => navigation.canGoBack() && navigation.goBack() },
            { text: 'Voir Premium', onPress: () => navigation.replace('Paywall') },
          ]);
          return;
        }

        // Pas connecté (mode invité) : il faut un compte
        if (!response.success && (response.code === 'AUTH_REQUIRED' || response.code === 'AUTH_INVALID')) {
          Alert.alert('Compte requis', 'Connecte-toi ou crée un compte gratuit pour analyser tes vidéos.', [
            { text: 'Plus tard', style: 'cancel', onPress: () => navigation.canGoBack() && navigation.goBack() },
            { text: 'Me connecter', onPress: () => navigation.replace('Login') },
          ]);
          return;
        }

        if (!response.success || !response.data) {
          throw new Error(
            typeof response.error === 'string'
              ? response.error
              : (response as any).error?.message || 'Erreur lors de l\'analyse'
          );
        }

        // Le backend renvoie { success, data: { analysis } } ; apiService enveloppe encore une fois
        const payload: any = response.data;
        let analysisData: any;
        if (payload?.data?.analysis) {
          analysisData = payload.data.analysis;
        } else if (payload?.analysis) {
          analysisData = payload.analysis;
        } else {
          analysisData = payload;
        }

        if (!analysisData || typeof analysisData !== 'object') {
          throw new Error('Réponse d\'analyse invalide');
        }

        const result = {
          ...analysisData,
          potentielViral:
            analysisData.score_sur_100 ??
            analysisData.avis_global?.note_sur_100 ??
            analysisData.potentielViral ??
            70,
          description:
            analysisData.resume_video?.court ||
            analysisData.description_video ||
            analysisData.description ||
            '',
          pointsForts:
            analysisData.pourquoi_ca_perce?.preview ||
            analysisData.analyse_viralite?.points_forts ||
            analysisData.pointsForts ||
            [],
          ameliorations:
            analysisData.pourquoi_ca_floppe?.preview ||
            analysisData.analyse_viralite?.points_faibles ||
            analysisData.ameliorations ||
            [],
        };

        setIsComplete(true);
        progressAnim.stopAnimation();
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
        setCompletedSteps([0, 1, 2, 3, 4]);
        setCurrentStep(ANALYSIS_STEPS.length - 1);
        Animated.spring(stepAnims[ANALYSIS_STEPS.length - 1].checkScale, {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }).start();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Court délai pour afficher "Analyse terminée" puis naviguer
        setTimeout(() => {
          if (cancelled) return;
          navigation.replace('AnalysisResult', { videoUri, result });
        }, 800);
      } catch (error: any) {
        if (cancelled) return;
        console.error('❌ Analyse vidéo échouée:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Erreur',
          error?.message || "L'analyse a échoué. Réessaie avec une autre vidéo.",
          [{ text: 'OK', onPress: () => navigation.canGoBack() && navigation.goBack() }]
        );
      }
    };

    runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [route.params?.videoUri, navigation]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0B021A', '#1E0F3C', '#0B021A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Particules animées */}
      <AnimatedBackground />

      {/* Glow central */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.centerGlow,
          { opacity: glowOpacity }
        ]}
        pointerEvents="none"
      >
        <View style={styles.glowCircle} />
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo animé avec glow */}
        <View style={styles.logoContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <View style={styles.logoGlow} />
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={styles.logo}
            >
              <Ionicons name="videocam" size={48} color="white" />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Titre */}
        <Text style={styles.title}>Analyse IA en cours</Text>
        <Text style={styles.subtitle}>
          Notre intelligence artificielle analyse ta vidéo en profondeur
        </Text>

        {/* Barre de progression premium */}
        <View style={styles.progressContainer}>
          <BlurView intensity={20} tint="dark" style={styles.progressBarWrapper}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth }
                ]}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </View>
          </BlurView>
          <Text style={styles.progressText}>
            {percent}%
          </Text>
        </View>

        {/* Liste des étapes avec animations premium */}
        <View style={styles.stepsList}>
          {ANALYSIS_STEPS.map((step, index) => {
            const stepGlowOpacity = stepAnims[index].glow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.6],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.stepRow,
                  {
                    opacity: stepAnims[index].opacity,
                    transform: [{ scale: stepAnims[index].scale }],
                  },
                  completedSteps.includes(index) && styles.stepRowCompleted,
                ]}
              >
                {/* Glow pour l'étape active */}
                {index === currentStep && !completedSteps.includes(index) && (
                  <Animated.View
                    style={[
                      styles.stepGlow,
                      { opacity: stepGlowOpacity, backgroundColor: `rgba(${step.color === '#8B5CF6' ? '139, 92, 246' : step.color === '#EC4899' ? '236, 72, 153' : step.color === '#F59E0B' ? '245, 158, 11' : '16, 185, 129'}, 0.2)` }
                    ]}
                    pointerEvents="none"
                  />
                )}

                <View style={styles.stepIconContainer}>
                  {completedSteps.includes(index) ? (
                    <Animated.View
                      style={[
                        styles.checkIcon,
                        {
                          transform: [{ scale: stepAnims[index].checkScale }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#22c55e', '#10B981']}
                        style={styles.checkIconGradient}
                      >
                        <Ionicons name="checkmark-circle" size={28} color="white" />
                      </LinearGradient>
                    </Animated.View>
                  ) : (
                    <BlurView
                      intensity={index === currentStep ? 30 : 10}
                      tint="dark"
                      style={[
                        styles.stepIcon,
                        index === currentStep && { backgroundColor: `rgba(${step.color === '#8B5CF6' ? '139, 92, 246' : step.color === '#EC4899' ? '236, 72, 153' : step.color === '#F59E0B' ? '245, 158, 11' : '16, 185, 129'}, 0.3)` }
                      ]}
                    >
                      <Ionicons
                        name={step.icon as any}
                        size={20}
                        color={index === currentStep ? step.color : theme.colors.text.tertiary}
                      />
                    </BlurView>
                  )}
                </View>
                <View style={styles.stepTextContainer}>
                  <Text
                    style={[
                      styles.stepText,
                      completedSteps.includes(index) && styles.stepTextCompleted,
                      index === currentStep && styles.stepTextActive,
                    ]}
                  >
                    {step.text}
                  </Text>
                  {index === currentStep && (
                    <Text style={styles.stepDescription}>
                      {step.description}
                    </Text>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Message de fin avec animation premium */}
        {isComplete && (
          <Animated.View style={styles.completeContainer}>
            <View style={styles.completeBadge}>
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.completeBadgeGradient}
              >
                <Ionicons name="checkmark-circle" size={28} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.completeText}>Analyse terminée ! 🎉</Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerGlow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    position: 'absolute',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    top: -10,
    left: -10,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBarWrapper: {
    borderRadius: 20,
    padding: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  progressText: {
    color: theme.colors.text.primary,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  stepsList: {
    width: '100%',
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  stepGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  stepRowCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  stepIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  checkIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  stepTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
    textShadowColor: 'rgba(139, 92, 246, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  stepTextCompleted: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  completeContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  completeBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  completeBadgeGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(236, 72, 153, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});





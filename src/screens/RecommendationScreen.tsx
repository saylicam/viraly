import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

interface RecommendationScreenProps {
  navigation: any;
  route: {
    params: {
      answers: Record<string, string[]>;
    };
  };
}

const KEY_RECOMMENDATIONS = [
  {
    icon: 'happy-outline',
    title: 'Humor & Entertainment',
    description: 'Crée du contenu divertissant avec des sketches courts et percutants',
    gradient: ['#ef4444', '#dc2626'],
  },
  {
    icon: 'flash-outline',
    title: 'Optimiser tes hooks',
    description: 'Commence toujours par une question ou une affirmation forte',
    gradient: ['#ef4444', '#dc2626'],
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Interagir avec ta communauté',
    description: 'Réponds aux commentaires dans les 2h pour maximiser l\'engagement',
    gradient: ['#ef4444', '#dc2626'],
  },
];

const SUGGESTED_SCHEDULE = [
  { day: 'Mercredi', time: '19h', type: 'Contenu principal', hashtags: ['#comedy', '#fyp'] },
  { day: 'Vendredi', time: '18h', type: 'Contenu secondaire', hashtags: ['#trending', '#viral'] },
  { day: 'Dimanche', time: '20h', type: 'Contenu principal', hashtags: ['#comedy', '#fyp'] },
];

export default function RecommendationScreen({ navigation, route }: RecommendationScreenProps) {
  const { answers } = route.params;
  const { user } = useAuth(); // Vérifier si user est connecté
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Animations pour les recommandations en cascade
  const recommendationAnims = useRef(
    KEY_RECOMMENDATIONS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
      scale: new Animated.Value(0.9),
      glow: new Animated.Value(0),
    }))
  ).current;

  // Animations pour les cartes de planning
  const scheduleAnims = useRef(
    SUGGESTED_SCHEDULE.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(-20),
    }))
  ).current;

  // Animation du header
  const headerAnim = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.8),
  }).current;

  // Animation du bouton
  const buttonAnim = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.9),
    glow: new Animated.Value(0),
  }).current;

  useEffect(() => {
    // Animation d'entrée principale
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

    // Animation du glow global
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );
    glowAnimation.start();

    // Animation du header
    Animated.parallel([
      Animated.timing(headerAnim.opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(headerAnim.scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation en cascade pour les recommandations
    const cascadeDelay = 200;
    recommendationAnims.forEach((anim, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();

        // Animation du glow pour chaque recommandation
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim.glow, {
              toValue: 1,
              duration: 2000 + index * 200,
              useNativeDriver: false,
            }),
            Animated.timing(anim.glow, {
              toValue: 0,
              duration: 2000 + index * 200,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }, 800 + (index * cascadeDelay));
    });

    // Animation en cascade pour les cartes de planning
    const scheduleDelay = 150;
    scheduleAnims.forEach((anim, index) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 800 + (KEY_RECOMMENDATIONS.length * cascadeDelay) + 400 + (index * scheduleDelay));
    });

    // Animation du bouton
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonAnim.opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(buttonAnim.scale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation du glow du bouton
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonAnim.glow, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(buttonAnim.glow, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }, 800 + (KEY_RECOMMENDATIONS.length * cascadeDelay) + 400 + (SUGGESTED_SCHEDULE.length * scheduleDelay) + 200);

    // Haptic feedback au chargement complet
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 800 + (KEY_RECOMMENDATIONS.length * cascadeDelay) + 400 + (SUGGESTED_SCHEDULE.length * scheduleDelay) + 400);
  }, []);

  // Extract answers for profile display
  const profileLevel = answers.level?.[0] || 'Débutant-e';
  const profileNiche = answers.niches?.[0] || 'Comédie';
  const profileFrequency = answers.frequency?.[0] || '1x / semaine';
  const profileGoal = answers.goal?.[0] || 'Augmenter mes vues';

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.15],
  });

  const buttonGlowOpacity = buttonAnim.glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
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
          {/* Header avec animation */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerAnim.opacity,
                transform: [{ scale: headerAnim.scale }]
              }
            ]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.headerIcon}
              >
                <Ionicons name="checkmark-circle" size={40} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Ton plan personnalisé</Text>
            <Text style={styles.subtitle}>
              Généré par notre IA selon tes réponses
            </Text>
          </Animated.View>

          {/* Profile Card */}
          <BlurView intensity={20} tint="dark" style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Ton profil</Text>
              <View style={styles.completeBadge}>
                <Ionicons name="checkmark" size={12} color="white" />
                <Text style={styles.completeBadgeText}>Complet</Text>
              </View>
            </View>
            
            <View style={styles.profileGrid}>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Niveau</Text>
                <Text style={styles.profileValue}>{profileLevel}</Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Niche</Text>
                <Text style={styles.profileValue}>{profileNiche}</Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Fréquence</Text>
                <Text style={styles.profileValue}>{profileFrequency}</Text>
              </View>
              <View style={styles.profileItem}>
                <Text style={styles.profileLabel}>Objectif</Text>
                <Text style={styles.profileValue}>{profileGoal}</Text>
              </View>
            </View>
          </BlurView>

          {/* Key Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommandations clés</Text>
            
            {KEY_RECOMMENDATIONS.map((rec, index) => {
              const recGlowOpacity = recommendationAnims[index].glow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.4],
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    {
                      opacity: recommendationAnims[index].opacity,
                      transform: [
                        { translateY: recommendationAnims[index].translateY },
                        { scale: recommendationAnims[index].scale }
                      ],
                    }
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.recommendationGlow,
                      { opacity: recGlowOpacity }
                    ]}
                    pointerEvents="none"
                  />
                  <BlurView intensity={15} tint="dark" style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                      <LinearGradient
                        colors={['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.3)']}
                        style={styles.recommendationIconContainer}
                      >
                        <Ionicons name={rec.icon as any} size={24} color="white" />
                      </LinearGradient>
                      <View style={styles.recommendationContent}>
                        <Text style={styles.recommendationTitle}>{rec.title}</Text>
                        <Text style={styles.recommendationDescription}>{rec.description}</Text>
                      </View>
                      <View style={styles.priorityBadge}>
                        <Ionicons name="close-circle" size={14} color="white" />
                        <Text style={styles.priorityBadgeText}>Priorité haute</Text>
                      </View>
                    </View>
                    <LinearGradient
                      colors={rec.gradient}
                      style={styles.recommendationGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </BlurView>
                </Animated.View>
              );
            })}
          </View>

          {/* Suggested Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Planning suggéré</Text>
            
            {SUGGESTED_SCHEDULE.map((schedule, index) => (
              <Animated.View
                key={index}
                style={[
                  {
                    opacity: scheduleAnims[index].opacity,
                    transform: [{ translateX: scheduleAnims[index].translateX }],
                  }
                ]}
              >
                <BlurView intensity={15} tint="dark" style={styles.scheduleCard}>
                  <LinearGradient
                    colors={theme.colors.gradient.primary}
                    style={styles.scheduleGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <View style={styles.scheduleContent}>
                    <View style={styles.scheduleDateContainer}>
                      <Text style={styles.scheduleDay}>{schedule.day}</Text>
                      <Text style={styles.scheduleTime}>{schedule.time}</Text>
                    </View>
                    <View style={styles.scheduleDetails}>
                      <Text style={styles.scheduleType}>{schedule.type}</Text>
                      <View style={styles.hashtagsContainer}>
                        {schedule.hashtags.map((tag, idx) => (
                          <View key={idx} style={styles.hashtagBadge}>
                            <Text style={styles.hashtagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>
            ))}
          </View>

          {/* CTA Button avec glow */}
          <Animated.View
            style={[
              styles.ctaButtonContainer,
              {
                opacity: buttonAnim.opacity,
                transform: [{ scale: buttonAnim.scale }]
              }
            ]}
          >
            <Animated.View
              style={[
                styles.buttonGlow,
                { opacity: buttonGlowOpacity }
              ]}
              pointerEvents="none"
            />
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                
                // Vérifier si un user est connecté
                if (user !== null && user !== undefined && !user.isGuest && user.uid !== 'guest') {
                  // Utilisateur connecté → Dashboard directement
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' }],
                  });
                } else {
                  // Pas connecté → Login avec les réponses du questionnaire
                  navigation.navigate('Login', { answers });
                }
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.ctaButtonGradient}
              >
                <Text style={styles.ctaButtonText}>Créer mon compte</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    position: 'absolute',
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
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  profileItem: {
    width: '48%',
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  recommendationCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  recommendationGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    top: 0,
    left: 0,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityBadgeText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recommendationGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  scheduleCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    overflow: 'hidden',
  },
  scheduleGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  scheduleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDateContainer: {
    marginRight: 20,
  },
  scheduleDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hashtagText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  ctaButtonContainer: {
    marginTop: 20,
    marginBottom: 32,
    position: 'relative',
  },
  buttonGlow: {
    position: 'absolute',
    width: '110%',
    height: '150%',
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    top: '-25%',
    left: '-5%',
  },
  ctaButton: {
    width: '100%',
    zIndex: 1,
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

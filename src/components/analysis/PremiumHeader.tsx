import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { ScoreCircle } from './ScoreCircle';

const { width } = Dimensions.get('window');

interface PremiumHeaderProps {
  score: number;
  verdict: string;
  category: string;
  onBack: () => void;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  score,
  verdict,
  category,
  onBack,
}) => {
  const getVerdictGradient = (verdict: string): string[] => {
    if (verdict.includes('Excellent')) return ['#10B981', '#34D399'];
    if (verdict.includes('Très Bien')) return ['#F59E0B', '#FBBF24'];
    if (verdict.includes('Bien')) return ['#8B5CF6', '#A78BFA'];
    return ['#EF4444', '#F87171'];
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      style={styles.container}
    >
      <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.15)', 'rgba(236, 72, 153, 0.1)', 'rgba(6, 182, 212, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>ANALYSE TERMINÉE</Text>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Prêt</Text>
            </View>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 200 }}
            style={styles.scoreContainer}
          >
            <ScoreCircle score={score} size={140} />
          </MotiView>

          <View style={styles.heroContent}>
            <LinearGradient
              colors={getVerdictGradient(verdict) as any}
              style={styles.verdictBadge}
            >
              <Text style={styles.verdictText}>{verdict}</Text>
            </LinearGradient>

            <Text style={styles.categoryText}>{category}</Text>
            <Text style={styles.heroDescription}>
              Analyse complète de votre vidéo réalisée avec l'intelligence artificielle
            </Text>
          </View>
        </View>
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  blurContainer: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    position: 'relative',
    zIndex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 6,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  placeholder: {
    width: 44,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  scoreContainer: {
    marginRight: 24,
  },
  heroContent: {
    flex: 1,
  },
  verdictBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  verdictText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
});









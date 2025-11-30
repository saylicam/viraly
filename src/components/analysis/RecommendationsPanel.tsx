import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface Recommendation {
  id: number;
  text: string;
  impact: 'faible' | 'moyen' | 'fort';
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[];
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
}) => {
  const getImpactColor = (impact: string): string[] => {
    switch (impact) {
      case 'fort':
        return colors.gradient.success;
      case 'moyen':
        return colors.gradient.accent;
      default:
        return ['#6B7280', '#9CA3AF'];
    }
  };

  const getImpactLabel = (impact: string): string => {
    switch (impact) {
      case 'fort':
        return 'Impact Fort';
      case 'moyen':
        return 'Impact Moyen';
      default:
        return 'Impact Faible';
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 1400 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.header}>
          <Ionicons name="bulb" size={24} color={colors.accent} />
          <Text style={styles.title}>RECOMMANDATIONS IA</Text>
        </View>

        {recommendations.map((rec, index) => (
          <MotiView
            key={rec.id}
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 1500 + index * 100 }}
            style={styles.recommendationItem}
          >
            <View style={styles.recommendationNumber}>
              <Text style={styles.recommendationNumberText}>{rec.id}</Text>
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationText}>{rec.text}</Text>
              <LinearGradient
                colors={getImpactColor(rec.impact) as any}
                style={styles.impactBadge}
              >
                <Text style={styles.impactText}>{getImpactLabel(rec.impact)}</Text>
              </LinearGradient>
            </View>
          </MotiView>
        ))}
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  blurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: colors.glow.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recommendationNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  impactBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  impactText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
  },
});



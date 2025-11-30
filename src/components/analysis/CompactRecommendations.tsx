import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Accordion } from './Accordion';

interface Recommendation {
  id: number;
  text: string;
  impact: 'faible' | 'moyen' | 'fort';
}

interface CompactRecommendationsProps {
  recommendations: Recommendation[];
}

export const CompactRecommendations: React.FC<CompactRecommendationsProps> = ({
  recommendations,
}) => {
  // Limiter à 5 max
  const displayRecs = recommendations.slice(0, 5);
  const remainingRecs = recommendations.slice(5);

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

  return (
    <View style={styles.container}>
      <View style={styles.list}>
          {displayRecs.map((rec) => (
            <View key={rec.id} style={styles.recItem}>
              <View style={styles.recNumber}>
                <Text style={styles.recNumberText}>{rec.id}</Text>
              </View>
              <View style={styles.recContent}>
                <Text style={styles.recText} numberOfLines={2}>
                  {rec.text}
                </Text>
                <LinearGradient
                  colors={getImpactColor(rec.impact) as any}
                  style={styles.impactBadge}
                >
                  <Text style={styles.impactText}>
                    {rec.impact === 'fort' ? 'Impact Fort' : 
                     rec.impact === 'moyen' ? 'Impact Moyen' : 'Impact Faible'}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          ))}
      </View>

      {remainingRecs.length > 0 && (
          <Accordion
            title="Voir toutes les recommandations"
            items={remainingRecs.map(r => `${r.id}. ${r.text}`)}
            icon="chevron-down"
            color={colors.accent}
            compact={false}
          />
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  blurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    borderRadius: 32, // rounded-3xl (32px)
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // border-white/20
    shadowColor: colors.glow.violet,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginLeft: 8,
  },
  list: {
    gap: 12,
  },
  recItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  recNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  recContent: {
    flex: 1,
  },
  recText: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
    marginBottom: 6,
  },
  impactBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.primary,
  },
});


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { ScoreCircle } from './ScoreCircle';

interface SummaryCardProps {
  score: number;
  retention: number;
  hookStrength: number;
  clarity: number;
  format: string;
  category: string;
  verdict: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  score,
  retention,
  hookStrength,
  clarity,
  format,
  category,
  verdict,
}) => {
  const getVerdictColor = (verdict: string): string[] => {
    if (verdict.includes('Excellent')) return colors.gradient.success;
    if (verdict.includes('Très Bien')) return colors.gradient.accent;
    if (verdict.includes('Bien')) return colors.gradient.primary;
    return ['#6B7280', '#4B5563'];
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 200 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <Text style={styles.title}>📊 RÉSUMÉ EXPRESS</Text>

        <View style={styles.mainContent}>
          {/* Score principal */}
          <View style={styles.scoreSection}>
            <ScoreCircle score={score} size={140} />
            <Text style={styles.scoreLabel}>Score Viral</Text>
          </View>

          {/* 4 blocs de stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{retention}%</Text>
              <Text style={styles.statLabel}>Rétention</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{hookStrength}%</Text>
              <Text style={styles.statLabel}>Hook</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{clarity}%</Text>
              <Text style={styles.statLabel}>Clarté</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{format}</Text>
              <Text style={styles.statLabel}>Format</Text>
            </View>
          </View>
        </View>

        {/* Badge verdict */}
        <LinearGradient
          colors={getVerdictColor(verdict) as any}
          style={styles.verdictBadge}
        >
          <Text style={styles.verdictText}>{verdict}</Text>
        </LinearGradient>

        {/* Badge catégorie */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
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
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: 'center',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 8,
  },
  statsGrid: {
    flex: 1,
    paddingLeft: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBlock: {
    width: '45%',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  verdictBadge: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.glow.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  verdictText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  categoryBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F472B6',
  },
});



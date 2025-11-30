import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { ScoreCircle } from './ScoreCircle';

interface SummaryExpressProps {
  score: number;
  retention: number;
  hookStrength: number;
  clarity: number;
}

export const SummaryExpress: React.FC<SummaryExpressProps> = ({
  score,
  retention,
  hookStrength,
  clarity,
}) => {
  const StatBlock = ({ 
    value, 
    label, 
    icon, 
    color 
  }: { 
    value: number; 
    label: string; 
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150 }}
      style={styles.statBlock}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}%</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </MotiView>
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 200 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        {/* Score principal au centre */}
        <View style={styles.scoreSection}>
          <ScoreCircle score={score} size={120} />
          <Text style={styles.scoreLabel}>Score Viral</Text>
        </View>

        {/* 4 blocs de stats */}
        <View style={styles.statsGrid}>
          <StatBlock
            value={retention}
            label="Rétention"
            icon="trending-up"
            color={colors.success}
          />
          <StatBlock
            value={hookStrength}
            label="Hook"
            icon="flash"
            color={colors.warning}
          />
          <StatBlock
            value={clarity}
            label="Clarté"
            icon="eye"
            color={colors.info}
          />
          <StatBlock
            value={Math.round((retention + hookStrength + clarity) / 3)}
            label="Moyenne"
            icon="stats-chart"
            color={colors.primary}
          />
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    borderRadius: 32, // rounded-3xl (32px)
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // border-white/20
    shadowColor: colors.glow.violet,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, // shadow-purple-500/30
    shadowRadius: 24,
    elevation: 12,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBlock: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});


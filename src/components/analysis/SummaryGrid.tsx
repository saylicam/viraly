import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface SummaryGridProps {
  score: number;
  format: string;
  retention: number;
  average: number;
}

export const SummaryGrid: React.FC<SummaryGridProps> = ({
  score,
  format,
  retention,
  average,
}) => {
  const StatBlock = ({
    icon,
    label,
    value,
    gradient,
    delay,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    gradient: string[];
    delay: number;
  }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay }}
      style={styles.statBlock}
    >
      <BlurView intensity={20} tint="dark" style={styles.statBlur}>
        <LinearGradient
          colors={gradient}
          style={styles.iconContainer}
        >
          <Ionicons name={icon} size={32} color="white" />
        </LinearGradient>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </BlurView>
    </MotiView>
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 300 }}
      style={styles.container}
    >
      <View style={styles.grid}>
        <StatBlock
          icon="trophy"
          label="Score"
          value={`${score}%`}
          gradient={colors.gradient.primary}
          delay={400}
        />
        <StatBlock
          icon="videocam"
          label="Format"
          value={format}
          gradient={colors.gradient.secondary}
          delay={500}
        />
        <StatBlock
          icon="trending-up"
          label="Rétention"
          value={`${retention}%`}
          gradient={colors.gradient.cyan}
          delay={600}
        />
        <StatBlock
          icon="stats-chart"
          label="Moyenne"
          value={`${average}%`}
          gradient={['#10B981', '#34D399']}
          delay={700}
        />
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statBlock: {
    width: '47%',
  },
  statBlur: {
    borderRadius: 32, // rounded-3xl (32px)
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
});









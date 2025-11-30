import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Target, Video, TrendingUp, Trophy, TrendingDown } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2; // 24px padding each side + 12px gap

interface ResultSummaryProps {
  score: number;
  format?: string;
  retention?: number;
  performance?: number; // +12% ou -8%
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({
  score,
  format = 'Général',
  retention = 0,
  performance = 0,
}) => {
  const getPerformanceColor = () => {
    if (performance > 0) return '#10B981'; // Emerald
    if (performance < 0) return '#F43F5E'; // Ruby
    return '#8F5BFF'; // Violet
  };

  const getPerformanceIcon = () => {
    if (performance > 0) return TrendingUp;
    if (performance < 0) return TrendingDown;
    return Trophy;
  };

  const PerformanceIcon = getPerformanceIcon();

  const summaryItems = [
    {
      icon: Target,
      label: 'Score',
      value: `${score}/100`,
      color: '#8F5BFF',
      gradient: ['#8F5BFF', '#D946EF'],
    },
    {
      icon: Video,
      label: 'Format',
      value: format,
      color: '#6EE7FF',
      gradient: ['#6EE7FF', '#3B82F6'],
    },
    {
      icon: TrendingUp,
      label: 'Rétention',
      value: `${retention}%`,
      color: '#D946EF',
      gradient: ['#D946EF', '#8F5BFF'],
    },
    {
      icon: PerformanceIcon,
      label: 'Moyenne',
      value: performance > 0 ? `+${performance}%` : `${performance}%`,
      color: getPerformanceColor(),
      gradient: performance > 0 
        ? ['#10B981', '#34D399']
        : performance < 0
        ? ['#F43F5E', '#FB7185']
        : ['#8F5BFF', '#D946EF'],
    },
  ];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 200 }}
    >
      <GlassCard variant="highlight" style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Résumé express</Text>
        </View>
        
        <View style={styles.grid}>
          {summaryItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <MotiView
                key={index}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 300 + index * 60 }}
              >
                <View style={styles.card}>
                  <LinearGradient
                    colors={item.gradient}
                    style={styles.iconContainer}
                  >
                    <Icon size={20} color="white" />
                  </LinearGradient>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.value}>{item.value}</Text>
                </View>
              </MotiView>
            );
          })}
        </View>
      </GlassCard>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});


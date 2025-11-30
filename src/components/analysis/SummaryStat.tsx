import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Target, Video, TrendingUp, Trophy } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

interface SummaryStatProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  gradient: string[];
  delay?: number;
}

export const SummaryStat: React.FC<SummaryStatProps> = ({
  icon: Icon,
  label,
  value,
  gradient,
  delay = 0,
}) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring' }}
      style={styles.container}
    >
      <BlurView intensity={15} tint="dark" style={styles.card}>
        <LinearGradient
          colors={gradient}
          style={styles.iconContainer}
        >
          <Icon size={20} color="white" />
        </LinearGradient>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </BlurView>
    </MotiView>
  );
};

interface SummaryStatsGridProps {
  score: number;
  format: string;
  retention: number;
  performance: number;
}

export const SummaryStatsGrid: React.FC<SummaryStatsGridProps> = ({
  score,
  format,
  retention,
  performance,
}) => {
  const getPerformanceValue = () => {
    if (performance > 0) return `+${performance}%`;
    return `${performance}%`;
  };

  const getPerformanceGradient = () => {
    if (performance > 0) return ['#10B981', '#34D399'];
    if (performance < 0) return ['#F43F5E', '#FB7185'];
    return ['#A56CFB', '#7F5BFF'];
  };

  const getPerformanceIcon = () => {
    if (performance > 0) return TrendingUp;
    if (performance < 0) return TrendingUp; // On peut utiliser TrendingDown si disponible
    return Trophy;
  };

  const PerformanceIcon = getPerformanceIcon();

  return (
    <View style={styles.grid}>
      <SummaryStat
        icon={Target}
        label="Score"
        value={`${score}/100`}
        gradient={['#A56CFB', '#7F5BFF']}
        delay={200}
      />
      <SummaryStat
        icon={Video}
        label="Format"
        value={format}
        gradient={['#5DEFFF', '#3B82F6']}
        delay={250}
      />
      <SummaryStat
        icon={TrendingUp}
        label="Rétention"
        value={`${retention}%`}
        gradient={['#7F5BFF', '#A56CFB']}
        delay={300}
      />
      <SummaryStat
        icon={PerformanceIcon}
        label="Moyenne"
        value={getPerformanceValue()}
        gradient={getPerformanceGradient()}
        delay={350}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

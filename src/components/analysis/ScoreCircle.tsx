import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';

interface ScoreCircleProps {
  score: number;
  size?: number;
  label?: string;
  animated?: boolean;
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  size = 140,
  label,
  animated = true,
}) => {
  const getScoreColor = (score: number): string[] => {
    if (score >= 80) return colors.gradient.success;
    if (score >= 60) return colors.gradient.accent;
    if (score >= 40) return ['#F59E0B', '#EF4444'];
    return ['#6B7280', '#4B5563'];
  };

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const CircleContent = () => (
    <View style={[styles.container, { width: size, height: size }]}>
      <LinearGradient
        colors={getScoreColor(score) as any}
        style={[
          styles.gradientCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: size - 12,
              height: size - 12,
              borderRadius: (size - 12) / 2,
            },
          ]}
        >
          <Text style={[styles.scoreText, { fontSize: size > 100 ? 32 : 24 }]}>
            {score}%
          </Text>
          {label && (
            <Text style={styles.labelText}>{label}</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  if (animated) {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 150 }}
      >
        <CircleContent />
      </MotiView>
    );
  }

  return <CircleContent />;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: colors.glow.violet,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  innerCircle: {
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  labelText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
});



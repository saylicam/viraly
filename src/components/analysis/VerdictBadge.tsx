import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';

interface VerdictBadgeProps {
  verdict: string;
  animated?: boolean;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({
  verdict,
  animated = true,
}) => {
  const getVerdictConfig = (verdict: string) => {
    if (verdict.includes('Excellent')) {
      return {
        colors: colors.gradient.success,
        glow: colors.glow.success,
      };
    }
    if (verdict.includes('Très Bien')) {
      return {
        colors: colors.gradient.accent,
        glow: colors.glow.warning,
      };
    }
    if (verdict.includes('Bien') || verdict.includes('Correct')) {
      return {
        colors: colors.gradient.primary,
        glow: colors.glow.violet,
      };
    }
    return {
      colors: ['#6B7280', '#4B5563'],
      glow: '#6B7280',
    };
  };

  const config = getVerdictConfig(verdict);

  const BadgeContent = () => (
    <LinearGradient
      colors={config.colors as any}
      style={styles.badge}
    >
      <Text style={styles.text}>{verdict}</Text>
    </LinearGradient>
  );

  if (animated) {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 150 }}
        style={styles.container}
      >
        <BadgeContent />
      </MotiView>
    );
  }

  return (
    <View style={styles.container}>
      <BadgeContent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    borderRadius: 32, // rounded-3xl (32px)
    paddingVertical: 16,
    paddingHorizontal: 40,
    shadowColor: colors.glow.violet,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
});


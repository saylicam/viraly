import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../theme/colors';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  variant?: 'default' | 'elevated' | 'subtle';
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  style,
  intensity = 20,
  variant = 'default',
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          borderColor: 'rgba(139, 92, 246, 0.3)',
          shadowColor: colors.glow.violet,
          shadowOpacity: 0.3,
        };
      case 'subtle':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          shadowColor: colors.glow.violet,
          shadowOpacity: 0.2,
        };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.card, variantStyle, style]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24, // rounded-3xl
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
});









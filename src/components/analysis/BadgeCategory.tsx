import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';

interface BadgeCategoryProps {
  category: string;
  animated?: boolean;
}

export const BadgeCategory: React.FC<BadgeCategoryProps> = ({
  category,
  animated = true,
}) => {
  const BadgeContent = () => (
    <LinearGradient
      colors={colors.gradient.magenta as any}
      style={styles.badge}
    >
      <Text style={styles.text}>{category}</Text>
    </LinearGradient>
  );

  if (animated) {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 150 }}
      >
        <BadgeContent />
      </MotiView>
    );
  }

  return <BadgeContent />;
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
    shadowColor: colors.glow.magenta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
});



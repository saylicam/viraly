import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Accordion } from './Accordion';

interface CompactStrengthsProps {
  strengths: string[];
}

export const CompactStrengths: React.FC<CompactStrengthsProps> = ({
  strengths,
}) => {
  // Limiter à 5 max
  const displayStrengths = strengths.slice(0, 5);

  return (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 800 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.header}>
          <Ionicons name="star" size={20} color={colors.success} />
          <Text style={styles.title}>Points Forts</Text>
        </View>

        <View style={styles.bullets}>
          {displayStrengths.map((strength, index) => (
            <View key={index} style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.bulletText} numberOfLines={1}>
                {strength}
              </Text>
            </View>
          ))}
        </View>

        {strengths.length > 5 && (
          <Accordion
            title="Voir tous les points forts"
            items={strengths.slice(5)}
            icon="chevron-down"
            color={colors.success}
            compact={false}
          />
        )}
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
    shadowColor: colors.glow.success,
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
    color: colors.success,
    marginLeft: 8,
  },
  bullets: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    marginLeft: 8,
  },
});


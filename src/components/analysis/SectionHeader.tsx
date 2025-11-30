import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
}) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={colors.gradient.premium as any}
          style={styles.gradient}
        >
          <Text style={styles.title}>{icon ? `${icon} ` : ''}{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </LinearGradient>
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  blurContainer: {
    borderRadius: 32, // rounded-3xl (32px)
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // border-white/20
  },
  gradient: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});



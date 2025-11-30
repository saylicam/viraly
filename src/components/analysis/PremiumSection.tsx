import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

interface PremiumSectionProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  gradient?: string[];
  children: React.ReactNode;
  delay?: number;
  variant?: 'default' | 'accent';
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({
  title,
  icon,
  iconColor = '#8B5CF6',
  gradient,
  children,
  delay = 0,
  variant = 'default',
}) => {
  const defaultGradient = gradient || ['rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.05)'];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200, delay }}
      style={styles.container}
    >
      <BlurView intensity={25} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={defaultGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />

        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
              <Ionicons name={icon} size={20} color={iconColor} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.content}>{children}</View>
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
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});









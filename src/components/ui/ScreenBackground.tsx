import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const { width, height } = Dimensions.get('window');

interface ScreenBackgroundProps {
  children?: React.ReactNode;
  variant?: 'default' | 'minimal';
}

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({ 
  children, 
  variant = 'minimal' // Par défaut minimal pour la Home
}) => {
  // Version minimaliste pour la Home
  if (variant === 'minimal') {
    return (
      <View style={styles.container}>
        {/* Fond Base: Dégradé violet sombre uni */}
        <LinearGradient
          colors={['#0F051D', '#1A0B2E', '#0F051D']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Halo 1: Très petit et diffus (top left) */}
        <MotiView
          from={{ opacity: 0.05, scale: 0.8 }}
          animate={{ opacity: 0.08, scale: 1 }}
          transition={{
            loop: true,
            type: 'timing',
            duration: 12000,
            repeatReverse: true,
          }}
          style={[styles.halo, styles.halo1]}
        />

        {/* Halo 2: Très petit et diffus (bottom right) */}
        <MotiView
          from={{ opacity: 0.05, scale: 1 }}
          animate={{ opacity: 0.07, scale: 0.9 }}
          transition={{
            loop: true,
            type: 'timing',
            duration: 15000,
            delay: 3000,
            repeatReverse: true,
          }}
          style={[styles.halo, styles.halo2]}
        />

        {/* Halo 3: Très petit et diffus (center) */}
        <MotiView
          from={{ opacity: 0.04, scale: 0.7 }}
          animate={{ opacity: 0.06, scale: 0.95 }}
          transition={{
            loop: true,
            type: 'timing',
            duration: 18000,
            delay: 6000,
            repeatReverse: true,
          }}
          style={[styles.halo, styles.halo3]}
        />

        {/* Texture grain très légère (2-4% opacity) */}
        <View style={styles.grainOverlay} pointerEvents="none" />

        {/* Vignette subtile pour profondeur */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(15, 5, 29, 0.3)',
            'rgba(15, 5, 29, 0.6)',
          ]}
          locations={[0, 0.8, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }

  // Version par défaut (pour les autres écrans si besoin)
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F051D', '#1A0B2E', '#0F051D']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F051D',
  },
  content: {
    flex: 1,
  },
  // Halos très petits et diffus (5-8% opacity)
  halo: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: '#8F5BFF',
  },
  halo1: {
    top: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.6,
    height: width * 0.6,
    opacity: 0.06,
  },
  halo2: {
    bottom: -width * 0.25,
    right: -width * 0.15,
    width: width * 0.5,
    height: width * 0.5,
    opacity: 0.06,
  },
  halo3: {
    top: height * 0.4,
    right: width * 0.1,
    width: width * 0.4,
    height: width * 0.4,
    opacity: 0.05,
  },
  // Texture grain très légère (2-4% opacity)
  grainOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.03,
    backgroundColor: 'transparent',
    // Note: Pour une vraie texture grain, on pourrait utiliser un SVG pattern
    // Pour l'instant, c'est un overlay très subtil
  },
});

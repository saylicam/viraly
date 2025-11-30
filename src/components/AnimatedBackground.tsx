import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

export default function AnimatedBackground() {
  const particles = useRef<Particle[]>([]);
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Créer 20 particules
  useEffect(() => {
    particles.current = Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
    }));

    // Animer chaque particule
    particles.current.forEach((particle, index) => {
      const duration = 8000 + Math.random() * 4000;
      
      // Animation X
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.x, {
            toValue: Math.random() * width,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: Math.random() * width,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animation Y
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.y, {
            toValue: Math.random() * height,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: Math.random() * height,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animation opacity
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.5 + 0.2,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.3 + 0.1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Animation du glow global
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.15],
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Glow central animé */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: glowOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0)', 'rgba(236, 72, 153, 1)', 'rgba(139, 92, 246, 0)']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Particules */}
      {particles.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.6)', 'rgba(236, 72, 153, 0.6)']}
            style={styles.particleGradient}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  particleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
});






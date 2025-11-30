import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const AnimatedAnalysisBackground: React.FC = () => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, duration: number, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      createAnimation(anim1, 8000, 0),
      createAnimation(anim2, 10000, 2000),
      createAnimation(anim3, 12000, 4000),
    ];

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, []);

  const translateY1 = anim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  const translateY2 = anim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const translateY3 = anim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  const opacity1 = anim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.2, 0.1],
  });

  const opacity2 = anim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.15, 0.25, 0.15],
  });

  const opacity3 = anim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.2, 0.1],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          {
            transform: [{ translateY: translateY1 }],
            opacity: opacity1,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.2)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          {
            transform: [{ translateY: translateY2 }],
            opacity: opacity2,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.3)', 'rgba(139, 92, 246, 0.2)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.blob,
          styles.blob3,
          {
            transform: [{ translateY: translateY3 }],
            opacity: opacity3,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(236, 72, 153, 0.3)', 'rgba(6, 182, 212, 0.2)']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: width,
  },
  blob1: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.3,
    left: -width * 0.2,
  },
  blob2: {
    width: width * 1.5,
    height: width * 1.5,
    top: height * 0.3,
    right: -width * 0.3,
  },
  blob3: {
    width: width * 1.3,
    height: width * 1.3,
    bottom: -width * 0.4,
    left: width * 0.1,
  },
});









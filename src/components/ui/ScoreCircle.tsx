import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

interface ScoreCircleProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  size = 'lg',
  label = 'Score',
  animated = true,
  style,
}) => {
  const getScoreColor = () => {
    if (score >= 80) return '#6EE7FF'; // Cyan Laser
    if (score >= 60) return '#8F5BFF'; // Violet
    if (score >= 40) return '#D946EF'; // Magenta
    return '#D946EF'; // Magenta (pour les scores bas aussi)
  };

  const getDimensions = () => {
    switch (size) {
      case 'sm': return { outer: 80, inner: 68, font: 24 };
      case 'md': return { outer: 120, inner: 104, font: 32 };
      case 'lg': return { outer: 180, inner: 156, font: 48 };
      case 'xl': return { outer: 220, inner: 192, font: 56 };
    }
  };

  const dims = getDimensions();
  const color = getScoreColor();

  const CircleContent = (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Glow externe */}
      <View
        style={{
          position: 'absolute',
          width: dims.outer * 1.4,
          height: dims.outer * 1.4,
          borderRadius: 9999,
          backgroundColor: color,
          opacity: 0.15,
        }}
      />

      {/* Cercle principal avec gradient */}
      <View
        style={{
          width: dims.outer,
          height: dims.outer,
          borderRadius: 9999,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 5,
          borderColor: color,
          shadowColor: color,
          shadowOpacity: 0.6,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <View
          style={{
            width: dims.inner,
            height: dims.inner,
            borderRadius: 9999,
            backgroundColor: 'rgba(11,11,21,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Text
            style={{
              fontSize: dims.font,
              fontWeight: '900',
              color: 'white',
              letterSpacing: -2,
            }}
          >
            {Math.round(score)}
          </Text>
          <Text
            style={{
              fontSize: dims.font / 4,
              fontWeight: '700',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 2,
              marginTop: 4,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
        </View>
      </View>

      {/* Pulse glow animation optionnel */}
      {animated && (
        <MotiView
          from={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.3 }}
          transition={{
            loop: true,
            type: 'timing',
            duration: 2000,
          }}
          style={{
            position: 'absolute',
            width: dims.outer,
            height: dims.outer,
            borderRadius: 9999,
            borderWidth: 3,
            borderColor: color,
          }}
        />
      )}
    </View>
  );

  if (animated) {
    return (
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, delay: 200 }}
      >
        {CircleContent}
      </MotiView>
    );
  }

  return CircleContent;
};


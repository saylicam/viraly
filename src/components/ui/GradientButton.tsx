import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  gradient?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  animated?: boolean;
  delay?: number;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  icon,
  iconRight,
  gradient,
  style,
  textStyle,
  disabled = false,
  variant = 'primary',
  size = 'large',
  fullWidth = true,
  animated = false,
  delay = 0,
}) => {
  const scale = useSharedValue(1);

  const getGradient = () => {
    if (gradient) return gradient;
    switch (variant) {
      case 'secondary':
        return ['#EC4899', '#F472B6'];
      case 'accent':
        return ['#06B6D4', '#3B82F6'];
      case 'success':
        return ['#10B981', '#34D399'];
      default:
        return ['#8B5CF6', '#EC4899'];
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 12, paddingHorizontal: 24, fontSize: 14 };
      case 'medium':
        return { paddingVertical: 14, paddingHorizontal: 28, fontSize: 16 };
      default:
        return { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18 };
    }
  };

  const sizeStyle = getSizeStyle();

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ButtonContent = () => (
    <Animated.View style={[fullWidth && styles.fullWidth, style, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={styles.pressable}
      >
        <LinearGradient
          colors={disabled ? ['#4B5563', '#6B7280'] : (getGradient() as any)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              paddingVertical: sizeStyle.paddingVertical,
              paddingHorizontal: sizeStyle.paddingHorizontal,
            },
            disabled && styles.disabled,
          ]}
        >
          {icon && <Ionicons name={icon} size={20} color="white" style={styles.icon} />}
          <Text
            style={[
              styles.text,
              { fontSize: sizeStyle.fontSize },
              textStyle,
              disabled && styles.textDisabled,
            ]}
          >
            {title}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={20} color="white" style={styles.iconRight} />}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  if (animated) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20, scale: 0.9 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 150, delay }}
      >
        <ButtonContent />
      </MotiView>
    );
  }

  return <ButtonContent />;
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  pressable: {
    width: '100%',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32, // rounded-3xl (32px)
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, // shadow-purple-500/30
    shadowRadius: 24,
    elevation: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  text: {
    color: 'white',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textDisabled: {
    opacity: 0.7,
  },
});

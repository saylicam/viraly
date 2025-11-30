import React from 'react';
import { View, ViewProps, TouchableOpacity, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { LucideIcon } from 'lucide-react-native';
import { styled } from 'nativewind';

const StyledBlurView = styled(BlurView);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  variant?: 'default' | 'highlight' | 'subtle';
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  title,
  icon: Icon,
  onPress, 
  variant = 'default',
  className = '',
  style,
  ...props 
}) => {
  const bgOpacity = variant === 'highlight' ? 'bg-white/8' : variant === 'subtle' ? 'bg-white/3' : 'bg-white/5';
  const borderStyle = 'border border-white/10';
  const highlightStyle = variant === 'highlight' ? 'border-t-white/25' : '';
  
  const shadowStyle = {
    shadowColor: '#8F5BFF',
    shadowOpacity: variant === 'highlight' ? 0.25 : 0.15,
    shadowRadius: variant === 'highlight' ? 20 : 15,
    shadowOffset: { width: 0, height: variant === 'highlight' ? 10 : 6 },
  };
  
  const Content = (
    <StyledBlurView
      intensity={25}
      tint="dark"
      className={`rounded-[28px] overflow-hidden ${bgOpacity} ${borderStyle} ${highlightStyle} ${className}`}
      style={[style, shadowStyle]}
      {...props}
    >
      {(title || Icon) && (
        <View className="flex-row items-center mb-3 px-6 pt-6">
          {Icon && (
            <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-3">
              <Icon size={18} color="#8F5BFF" />
            </View>
          )}
          {title && (
            <Text className="text-white font-bold text-lg">{title}</Text>
          )}
        </View>
      )}
      <View className={title || Icon ? 'px-6 pb-6' : 'p-6'}>
        {children}
      </View>
    </StyledBlurView>
  );

  if (onPress) {
    return (
      <StyledTouchableOpacity 
        onPress={onPress}
        activeOpacity={0.75}
        style={shadowStyle}
      >
        {Content}
      </StyledTouchableOpacity>
    );
  }

  return (
    <View style={shadowStyle}>
      {Content}
    </View>
  );
};

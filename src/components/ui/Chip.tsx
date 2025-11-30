import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';

interface ChipProps {
  label: string;
  variant?: 'violet' | 'cyan' | 'magenta' | 'emerald' | 'ruby' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'violet',
  size = 'md',
  icon: Icon,
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'violet': return ['#8F5BFF', '#A78BFA'];
      case 'cyan': return ['#6EE7FF', '#93E5FF'];
      case 'magenta': return ['#D946EF', '#E879F9'];
      case 'emerald': return ['#10B981', '#34D399'];
      case 'ruby': return ['#F43F5E', '#FB7185'];
      case 'amber': return ['#F59E0B', '#FBBF24'];
      default: return ['#8F5BFF', '#A78BFA'];
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1';
      case 'lg': return 'px-5 py-3';
      default: return 'px-4 py-2';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  return (
    <View 
      className={`rounded-full overflow-hidden ${getSizeClasses()} self-start`}
      style={[{ 
        shadowColor: getColors()[0], 
        shadowOpacity: 0.4, 
        shadowRadius: 8, 
        shadowOffset: { width: 0, height: 4 } 
      }, style]}
    >
      <LinearGradient
        colors={getColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="flex-row items-center justify-center"
      >
        {Icon && <Icon size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} color="white" style={{ marginRight: 6 }} />}
        <Text className={`text-white font-bold ${getTextSize()} tracking-wide`}>
          {label.toUpperCase()}
        </Text>
      </LinearGradient>
    </View>
  );
};


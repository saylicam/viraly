import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { MotiView } from 'moti';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  animated?: boolean;
  delay?: number;
  style?: ViewStyle;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = '#8B5CF6',
  animated = true,
  delay = 0,
  style,
}) => {
  const Content = (
    <View style={[{ marginBottom: 20 }, style]}>
      <View className="flex-row items-center mb-2">
        {Icon && (
          <View 
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Icon size={18} color={iconColor} />
          </View>
        )}
        <Text className="text-white text-xl font-bold tracking-tight">
          {title}
        </Text>
      </View>
      {subtitle && (
        <Text className="text-gray-400 text-sm ml-11 leading-5">
          {subtitle}
        </Text>
      )}
    </View>
  );

  if (animated) {
    return (
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 400, delay }}
      >
        {Content}
      </MotiView>
    );
  }

  return Content;
};
















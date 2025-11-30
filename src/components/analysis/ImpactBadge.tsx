import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface ImpactBadgeProps {
  impact: '+10' | '+5' | '0' | '-5' | '-10';
}

export const ImpactBadge: React.FC<ImpactBadgeProps> = ({ impact }) => {
  const getImpactStyle = (impact: string) => {
    switch (impact) {
      case '+10':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 0.4)',
          color: colors.impact.positive10,
        };
      case '+5':
        return {
          backgroundColor: 'rgba(52, 211, 153, 0.2)',
          borderColor: 'rgba(52, 211, 153, 0.4)',
          color: colors.impact.positive5,
        };
      case '0':
        return {
          backgroundColor: 'rgba(107, 114, 128, 0.2)',
          borderColor: 'rgba(107, 114, 128, 0.4)',
          color: colors.impact.neutral,
        };
      case '-5':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          color: colors.impact.negative5,
        };
      case '-10':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          color: colors.impact.negative10,
        };
      default:
        return {
          backgroundColor: 'rgba(107, 114, 128, 0.2)',
          borderColor: 'rgba(107, 114, 128, 0.4)',
          color: colors.impact.neutral,
        };
    }
  };

  const style = getImpactStyle(impact);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
        },
      ]}
    >
      <Text style={[styles.text, { color: style.color }]}>{impact}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});



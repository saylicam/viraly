import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface SectionSeparatorProps {
  height?: number;
}

export const SectionSeparator: React.FC<SectionSeparatorProps> = ({
  height = 1,
}) => {
  return (
    <View style={[styles.container, { height }]}>
      <LinearGradient
        colors={['transparent', colors.primary + '40', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
});









import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';

interface EmotionChipProps {
  emotion: string;
  index?: number;
}

export const EmotionChip: React.FC<EmotionChipProps> = ({
  emotion,
  index = 0,
}) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: index * 50 }}
    >
      <View style={styles.chip}>
        <Text style={styles.text}>{emotion}</Text>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F472B6',
  },
});



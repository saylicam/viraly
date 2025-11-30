import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Clipboard } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import * as Haptics from 'expo-haptics';

interface HashtagChipProps {
  hashtag: string;
  onPress?: () => void;
  index?: number;
}

export const HashtagChip: React.FC<HashtagChipProps> = ({
  hashtag,
  onPress,
  index = 0,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Clipboard.setString(hashtag);
    if (onPress) {
      onPress();
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: index * 50 }}
    >
      <TouchableOpacity
        onPress={handlePress}
        style={styles.chip}
        activeOpacity={0.7}
      >
        <Text style={styles.text}>{hashtag}</Text>
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C4B5FD',
  },
});


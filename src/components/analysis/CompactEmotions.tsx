import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { EmotionChip } from './EmotionChip';

interface CompactEmotionsProps {
  emotions: string[];
}

export const CompactEmotions: React.FC<CompactEmotionsProps> = ({
  emotions,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {emotions.map((emotion, index) => (
          <EmotionChip key={index} emotion={emotion} index={index} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  blurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    borderRadius: 32, // rounded-3xl (32px)
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // border-white/20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});


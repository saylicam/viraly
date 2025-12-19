import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Chip } from '../ui/Chip';
import { MotiView } from 'moti';

interface EmotionTagsProps {
  emotions: string[];
}

export const EmotionTags: React.FC<EmotionTagsProps> = ({ emotions }) => {
  if (!emotions || emotions.length === 0) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 1100 }}
      style={styles.container}
    >
      <Text style={styles.title}>Émotions détectées</Text>
      <View style={styles.tagsContainer}>
        {emotions.map((emotion, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1200 + index * 50 }}
          >
            <Chip
              label={emotion.replace(/[🎯🔥✨👍]/g, '').trim()}
              variant="cyan"
              size="sm"
            />
          </MotiView>
        ))}
      </View>
    </MotiView>
  );
};

interface HashtagTagsProps {
  hashtags: string[];
}

export const HashtagTags: React.FC<HashtagTagsProps> = ({ hashtags }) => {
  if (!hashtags || hashtags.length === 0) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 1300 }}
      style={styles.container}
    >
      <Text style={styles.title}>Hashtags recommandés</Text>
      <View style={styles.tagsContainer}>
        {hashtags.map((tag, index) => {
          const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
          return (
            <MotiView
              key={index}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1400 + index * 50 }}
            >
              <Chip
                label={cleanTag}
                variant="violet"
                size="sm"
              />
            </MotiView>
          );
        })}
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
















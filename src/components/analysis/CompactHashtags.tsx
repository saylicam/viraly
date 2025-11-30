import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Clipboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { HashtagChip } from './HashtagChip';

interface CompactHashtagsProps {
  hashtags: string[];
  maxVisible?: number;
}

export const CompactHashtags: React.FC<CompactHashtagsProps> = ({
  hashtags,
  maxVisible = 10,
}) => {
  const [copied, setCopied] = useState(false);
  const displayHashtags = hashtags.slice(0, maxVisible);

  const copyAll = async () => {
    const text = hashtags.join(' ');
    await Clipboard.setString(text);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={copyAll} style={styles.copyButton}>
          <Ionicons name="copy-outline" size={16} color={colors.success} />
          <Text style={styles.copyButtonText}>
            {copied ? '✓ Copié' : 'Copier tout'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chips}>
        {displayHashtags.map((hashtag, index) => (
          <HashtagChip key={index} hashtag={hashtag} index={index} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 6,
  },
  copyButtonText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});


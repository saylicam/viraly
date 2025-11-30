import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface CompactAIOpinionProps {
  verdict: string;
  score: number;
  category: string;
}

export const CompactAIOpinion: React.FC<CompactAIOpinionProps> = ({
  verdict,
  score,
  category,
}) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 50 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 150, delay: 300 }}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.header}>
          <Ionicons name="star" size={20} color={colors.accent} />
          <Text style={styles.title}>Avis Général IA</Text>
        </View>
        <Text style={styles.text} numberOfLines={3}>
          {verdict} - Score de {score}% pour une vidéo {category}. 
          Analyse complète disponible ci-dessous.
        </Text>
      </BlurView>
    </MotiView>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  text: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});


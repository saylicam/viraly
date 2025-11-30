import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { MotiView } from 'moti';
import { Sparkles } from 'lucide-react-native';

interface VideoDescriptionProps {
  description: string;
}

export const VideoDescription: React.FC<VideoDescriptionProps> = ({ description }) => {
  if (!description) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 400 }}
    >
      <GlassCard variant="default" style={styles.container}>
        <View style={styles.header}>
          <Sparkles size={18} color="#8F5BFF" />
          <Text style={styles.title}>Description de la vidéo</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </GlassCard>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});








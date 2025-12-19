import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

interface VideoDescriptionProps {
  description: string;
}

export const VideoDescription: React.FC<VideoDescriptionProps> = ({ description }) => {
  if (!description) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 300 }}
    >
      <BlurView intensity={20} tint="dark" style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Sparkles size={18} color="#A56CFB" />
          </View>
          <Text style={styles.title}>Description de la vidéo</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#A56CFB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(165, 108, 251, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
















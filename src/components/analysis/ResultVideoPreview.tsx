import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../ui/GlassCard';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

interface ResultVideoPreviewProps {
  videoUri: string;
}

export const ResultVideoPreview: React.FC<ResultVideoPreviewProps> = ({ videoUri }) => {
  const videoRef = React.useRef<Video>(null);

  React.useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.playAsync();
        } catch (error) {
          console.error('Error playing video:', error);
        }
      }
    };
    playVideo();
  }, [videoUri]);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', delay: 100 }}
    >
      <GlassCard variant="highlight" style={styles.card}>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay
          />
          
          {/* Badge "Analyse IA complète" */}
          <View style={styles.badge}>
            <BlurView intensity={20} tint="dark" style={styles.badgeBlur}>
              <Text style={styles.badgeText}>Analyse IA complète</Text>
            </BlurView>
          </View>
        </View>
      </GlassCard>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    padding: 0,
    marginBottom: 24,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  badgeBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(143, 91, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(143, 91, 255, 0.5)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
















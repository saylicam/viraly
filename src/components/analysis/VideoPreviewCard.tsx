import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface VideoPreviewCardProps {
  videoUri: string;
}

export const VideoPreviewCard: React.FC<VideoPreviewCardProps> = ({ videoUri }) => {
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
      <View style={styles.container}>
        <BlurView intensity={20} tint="dark" style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Vidéo analysée</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Analyse IA complète</Text>
            </View>
          </View>

          <View style={styles.videoWrapper}>
            {/* Cyan glow shadow */}
            <View style={styles.glowShadow} />
            
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              isLooping
              isMuted
              shouldPlay
            />
          </View>
        </BlurView>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    shadowColor: '#A56CFB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(165, 108, 251, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(165, 108, 251, 0.4)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  videoWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  glowShadow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    backgroundColor: '#5DEFFF',
    opacity: 0.15,
    shadowColor: '#5DEFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});








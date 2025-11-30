import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { GlassCard } from '../ui/GlassCard';

interface VideoPreviewProps {
  videoUri: string;
  onRemove?: () => void;
  onPress?: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUri,
  onRemove,
  onPress,
}) => {
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
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.container}
    >
      <GlassCard variant="highlight" className="overflow-hidden p-0" style={styles.card}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted
          shouldPlay
        />
        
        {/* Overlay avec bouton supprimer */}
        {onRemove && (
          <View style={styles.overlay}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              style={styles.removeButton}
            >
              <BlurView intensity={20} tint="dark" style={styles.removeButtonBlur}>
                <X size={18} color="white" />
              </BlurView>
            </TouchableOpacity>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    shadowColor: '#8F5BFF',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 24, // rounded-3xl
  },
  overlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  removeButtonBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});


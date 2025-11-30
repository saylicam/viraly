import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { Upload, Sparkles, RefreshCw } from 'lucide-react-native';

import { ScreenBackground } from '../components/ui/ScreenBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { VideoPreview } from '../components/analysis/VideoPreview';
import { AnalyzeInfo } from '../components/analysis/AnalyzeInfo';
import { apiService } from '../services/api';

const { width } = Dimensions.get('window');

export default function AnalyzeScreen({ navigation }: any) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ name?: string; size?: number } | null>(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour analyser tes vidéos.");
      return false;
    }
    return true;
  };

  const handleSelectVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedVideo(asset.uri);
        setVideoInfo({
          name: asset.fileName || 'video.mp4',
          size: asset.fileSize,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la vidéo. Réessaye plus tard.');
    }
  };

  const handleRemoveVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVideo(null);
    setVideoInfo(null);
  };

  const analyzeVideo = async () => {
    if (!selectedVideo) return;
    setIsAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      navigation.navigate('VideoAnalyzing', { videoUri: selectedVideo });
      
      const healthCheck = await apiService.healthCheck();
      if (!healthCheck.success) throw new Error('Serveur inaccessible');

      const response = await apiService.uploadVideo(selectedVideo);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur analyse');
      }

      // Le backend renvoie { success: true, data: { analysis: {...} } }
      // Donc response.data contient { analysis: {...} }
      // Vérifier la structure : response.data.data.analysis OU response.data.analysis
      let analysisData: any;
      
      if (response.data.data?.analysis) {
        // Format: { success: true, data: { data: { analysis: {...} } } }
        analysisData = response.data.data.analysis;
      } else if (response.data.analysis) {
        // Format: { success: true, data: { analysis: {...} } }
        analysisData = response.data.analysis;
      } else {
        // Format direct: { success: true, data: {...} }
        analysisData = response.data;
      }
      
      console.log('📊 Structure response.data:', Object.keys(response.data));
      console.log('📊 Données analysisData extraites:', {
        has_description_video: !!analysisData.description_video,
        has_avis_global: !!analysisData.avis_global,
        has_analyse_viralite: !!analysisData.analyse_viralite,
        has_prediction_performance: !!analysisData.prediction_performance,
        keys: Object.keys(analysisData).slice(0, 10),
      });
      
      // Créer l'objet result avec toutes les données de l'analyse
      const result = {
        // Données principales (nouveau format) - TOUTES les données de l'analyse
        ...analysisData,
        // Compatibilité legacy (pour l'ancien frontend si nécessaire)
        potentielViral: analysisData.avis_global?.note_sur_100 || analysisData.potentielViral || 70,
        description: analysisData.description_video || analysisData.description || '',
        pointsForts: analysisData.analyse_viralite?.points_forts || analysisData.pointsForts || [],
        ameliorations: analysisData.analyse_viralite?.points_faibles || analysisData.ameliorations || [],
      };

      console.log('📊 Result final - Champs clés:', {
        description_video: result.description_video?.substring(0, 50) || 'MANQUANT',
        avis_global: result.avis_global ? 'PRÉSENT' : 'MANQUANT',
        analyse_viralite: result.analyse_viralite ? 'PRÉSENT' : 'MANQUANT',
        caption_optimisee: result.caption_optimisee?.substring(0, 50) || 'MANQUANT',
      });

      navigation.replace('AnalysisResult', { videoUri: selectedVideo, result });

    } catch (error: any) {
      console.error(error);
      Alert.alert('Erreur', error.message || "L'analyse a échoué");
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScreenBackground variant="minimal">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header - Plus compact */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={styles.header}
          >
            <Text style={styles.title}>
              Analyse <Text style={styles.titleAccent}>IA</Text>
            </Text>
            <Text style={styles.subtitle}>
              Sélectionne une vidéo et découvre son potentiel viral
            </Text>
          </MotiView>

          {/* Zone d'Upload - RÉDUITE (25-30% de moins) */}
          {!selectedVideo ? (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 100 }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSelectVideo}
              >
                <GlassCard variant="highlight" style={styles.uploadCard}>
                  <View style={styles.uploadContent}>
                    {/* Glow sous l'icône */}
                    <View style={styles.iconGlow} />
                    <View style={styles.uploadIconContainer}>
                      <Upload size={32} color="#8F5BFF" strokeWidth={2.5} />
                    </View>
                    <Text style={styles.uploadTitle}>Aucune vidéo sélectionnée</Text>
                    <Text style={styles.uploadSubtitle}>
                      Appuie pour choisir une vidéo
                    </Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </MotiView>
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 100 }}
            >
              <View>
                <VideoPreview
                  videoUri={selectedVideo}
                  onRemove={handleRemoveVideo}
                  onPress={handleSelectVideo}
                />
                {/* Bouton "Changer la vidéo" sous le player */}
                <TouchableOpacity
                  onPress={handleSelectVideo}
                  style={styles.changeVideoButton}
                >
                  <RefreshCw size={14} color="#8F5BFF" style={{ marginRight: 6 }} />
                  <Text style={styles.changeVideoText}>Changer la vidéo</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}

          {/* CTA Principal - Visible sans scroller */}
          {selectedVideo && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 80, damping: 20 }}
              style={styles.analyzeButtonContainer}
            >
              <NeonButton
                title={isAnalyzing ? "ANALYSE EN COURS..." : "Analyser cette vidéo"}
                onPress={analyzeVideo}
                size="large"
                fullWidth
                icon={Sparkles}
                loading={isAnalyzing}
              />
            </MotiView>
          )}

          {/* Section Marketing - Compacte avec séparateurs */}
          {!selectedVideo && (
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
              style={styles.infoSection}
            >
              <AnalyzeInfo />
            </MotiView>
          )}

          {/* Footer léger */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Propulsé par Gemini 1.5 Pro</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50, // Réduit de 60
  },
  header: {
    marginBottom: 28, // Réduit de 32
  },
  title: {
    fontSize: 28, // Réduit de 32
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6, // Réduit de 8
  },
  titleAccent: {
    color: '#8F5BFF',
  },
  subtitle: {
    fontSize: 15, // Réduit de 16
    color: 'rgba(255, 255, 255, 0.7)', // Opacity 70%
    lineHeight: 21,
  },
  uploadCard: {
    minHeight: 170, // Réduit de 240 (29% de réduction)
    paddingVertical: 24, // Réduit
    paddingHorizontal: 24,
  },
  uploadContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#8F5BFF',
    opacity: 0.2,
    top: -5,
  },
  uploadIconContainer: {
    width: 64, // Réduit de 80
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(143, 91, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(143, 91, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16, // Réduit de 20
    zIndex: 1,
  },
  uploadTitle: {
    fontSize: 18, // Réduit de 20
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6, // Réduit de 8
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 13, // Réduit de 14
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  changeVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  changeVideoText: {
    fontSize: 13,
    color: '#8F5BFF',
    fontWeight: '600',
  },
  analyzeButtonContainer: {
    marginTop: 20, // Réduit de 24
    marginBottom: 8,
  },
  infoSection: {
    marginTop: 32, // Plus d'air
  },
  footer: {
    marginTop: 40, // Plus d'air
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '500',
  },
});

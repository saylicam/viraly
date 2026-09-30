import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Sparkles, RefreshCw, Upload } from 'lucide-react-native';

import { NeonButton } from '../components/ui/NeonButton';
import { VideoPreview } from '../components/analysis/VideoPreview';
import { AnalyzeInfo } from '../components/analysis/AnalyzeInfo';
import { useRevenueCat } from '../context/RevenueCatContext';

const { width } = Dimensions.get('window');

export default function AnalyzeScreen({ navigation }: any) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ name?: string; size?: number } | null>(null);
  const { isPremium, isLoading: subscriptionLoading } = useRevenueCat();

  // L'analyse est réservée aux abonnés : sinon, on affiche le paywall
  const ensurePremium = () => {
    if (subscriptionLoading) {
      Alert.alert('Un instant…', 'Vérification de ton abonnement en cours, réessaie dans une seconde.');
      return false;
    }
    if (!isPremium) {
      navigation.navigate('Paywall');
      return false;
    }
    return true;
  };

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
    if (!ensurePremium()) return;
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
          name: asset.fileName || asset.uri.split('/').pop(),
          size: asset.fileSize,
        });
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
    if (!selectedVideo || isAnalyzing) return;
    if (!ensurePremium()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsAnalyzing(true);

    // L'appel Gemini + navigation résultats se font dans VideoAnalyzingScreen
    navigation.navigate('VideoAnalyzing', { videoUri: selectedVideo });
    setIsAnalyzing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Titre Analyse IA */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.titlePrefix}>Analyse</Text>
            <View style={styles.titleCapsule}>
              <Text style={styles.titleCapsuleText}>IA</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Découvre le potentiel viral de tes vidéos en quelques secondes
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ height: 18 }} />

        {/* Carte Téléverse ta vidéo */}
        {!selectedVideo ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSelectVideo}
            style={styles.uploadCard}
          >
            <Upload size={48} color="#FFFFFF" strokeWidth={2.5} style={styles.uploadIcon} />
            <Text style={styles.uploadTitle}>Téléverse ta vidéo</Text>
            <Text style={styles.uploadSubtitle}>
              Appuie pour choisir une vidéo depuis ta galerie
            </Text>
          </TouchableOpacity>
        ) : (
          <View>
            <VideoPreview
              videoUri={selectedVideo}
              onRemove={handleRemoveVideo}
              onPress={handleSelectVideo}
            />
            <TouchableOpacity
              onPress={handleSelectVideo}
              style={styles.changeVideoButton}
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color="#B371FF" style={{ marginRight: 8 }} />
              <Text style={styles.changeVideoText}>Changer la vidéo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CTA Principal */}
        {selectedVideo && (
          <View style={styles.analyzeButtonContainer}>
            <NeonButton
              title={isAnalyzing ? "ANALYSE EN COURS..." : "Analyser cette vidéo"}
              onPress={analyzeVideo}
              size="large"
              fullWidth
              icon={Sparkles}
              loading={isAnalyzing}
            />
          </View>
        )}

        {/* Spacer */}
        {!selectedVideo && <View style={{ height: 28 }} />}

        {/* Section "Ce que l'analyse IA va t'apporter" */}
        {!selectedVideo && <AnalyzeInfo />}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0214',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0214',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0A0214',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#0A0214',
  },
  header: {
    marginBottom: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titlePrefix: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  titleCapsule: {
    backgroundColor: '#FF4FF9',
    paddingHorizontal: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  titleCapsuleText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    color: '#EAEAEA',
    opacity: 0.85,
    lineHeight: 22,
  },
  uploadCard: {
    width: '100%',
    paddingVertical: 38,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: '#1B0730',
    borderWidth: 1.4,
    borderColor: 'rgba(179, 113, 255, 0.45)',
    shadowColor: '#B371FF',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    alignItems: 'center',
    elevation: 12,
  },
  uploadIcon: {
    // Icon shadow effect removed - lucide-react-native doesn't support textShadow
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 14,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#EAEAEA',
    marginTop: 6,
    textAlign: 'center',
  },
  changeVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  changeVideoText: {
    fontSize: 14,
    color: '#B371FF',
    fontWeight: '600',
  },
  analyzeButtonContainer: {
    marginTop: 24,
    marginBottom: 12,
  },
});

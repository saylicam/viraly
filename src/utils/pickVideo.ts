import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PickedVideo {
  uri: string;
  fileName?: string | null;
  fileSize?: number;
}

/**
 * Ouvre la galerie pour choisir une vidéo (même comportement sur tous les écrans).
 * Retourne null si l'utilisateur annule ou refuse l'accès.
 */
export const pickVideo = async (): Promise<PickedVideo | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour analyser tes vidéos.");
    return null;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 60,
      // Conversion en 720p : contourne un bug d'expo-image-picker (copie de l'original sans
      // téléchargement iCloud → erreur 3164) et allège la vidéo envoyée au serveur.
      videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return { uri: asset.uri, fileName: asset.fileName, fileSize: asset.fileSize };
  } catch (error: any) {
    console.error('❌ Sélection vidéo échouée:', error);
    // 3164 = la vidéo est sur iCloud et iOS n'a pas pu la télécharger
    const isICloud = String(error?.message || '').includes('3164');
    Alert.alert(
      'Erreur',
      (isICloud
        ? "Cette vidéo est stockée sur iCloud et n'a pas pu être téléchargée. Ouvre-la une fois dans l'app Photos (elle se télécharge), puis réessaie."
        : 'Impossible de charger la vidéo. Réessaie avec une autre vidéo.')
        + (__DEV__ && error?.message ? `\n\n(${error.message})` : '')
    );
    return null;
  }
};

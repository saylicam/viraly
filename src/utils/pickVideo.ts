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
      // Évite la conversion du fichier par iOS (source fréquente d'échecs sur les vidéos iCloud/HEVC)
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return { uri: asset.uri, fileName: asset.fileName, fileSize: asset.fileSize };
  } catch (error: any) {
    console.error('❌ Sélection vidéo échouée:', error);
    Alert.alert(
      'Erreur',
      "Impossible de charger la vidéo. Si elle est stockée sur iCloud, attends qu'elle soit téléchargée sur ton iPhone puis réessaie."
        + (__DEV__ && error?.message ? `\n\n(${error.message})` : '')
    );
    return null;
  }
};

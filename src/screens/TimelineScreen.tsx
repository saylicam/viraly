import React from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Droplet,
  Eye,
  Sparkles,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react-native';

import { ScreenBackground } from '../components/ui/ScreenBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // 24px padding + 16px gap

export default function TimelineScreen() {
  const navigation = useNavigation<any>();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour analyser tes vidéos.");
      return false;
    }
    return true;
  };

  const handleAnalyze = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
        navigation.navigate('VideoAnalyzing', { videoUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la vidéo. Réessaye plus tard.');
    }
  };

  // Dates du calendrier (exemple)
  const calendarDays = [
    { day: 'Lun', date: 15, active: false },
    { day: 'Mar', date: 16, active: false },
    { day: 'Mer', date: 17, active: false },
    { day: 'Jeu', date: 18, active: true }, // Jour actuel avec sparkle
  ];

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* HEADER: Bonjour Créateur */}
        <View className="px-6 pt-16 pb-6">
          <Text className="text-white text-3xl font-bold mb-2">
            Bonjour Créateur 👋
          </Text>
          <Text className="text-gray-300 text-base">
            Prêt à analyser tes vidéos ?
          </Text>
        </View>

        {/* SECTION: Cartes Statistiques (7 jours + Vues totales) */}
        <View className="px-6 mb-6">
          <View className="flex-row" style={{ gap: 16 }}>
            {/* Carte 1: 7 jours - Série */}
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 100 }}
              style={{ width: CARD_WIDTH }}
            >
              <LinearGradient
                colors={['#D946EF', '#8F5BFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl p-5"
                style={{
                  shadowColor: '#D946EF',
                  shadowOpacity: 0.3,
                  shadowRadius: 15,
                  shadowOffset: { width: 0, height: 8 },
                }}
              >
                <Droplet size={24} color="white" style={{ marginBottom: 12 }} />
                <Text className="text-white text-3xl font-bold mb-1">7 jours</Text>
                <Text className="text-white/80 text-sm">Série</Text>
              </LinearGradient>
            </MotiView>

            {/* Carte 2: 156.0K - Vues totales */}
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 200 }}
              style={{ width: CARD_WIDTH }}
            >
              <LinearGradient
                colors={['#8F5BFF', '#6EE7FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl p-5"
                style={{
                  shadowColor: '#8F5BFF',
                  shadowOpacity: 0.3,
                  shadowRadius: 15,
                  shadowOffset: { width: 0, height: 8 },
                }}
              >
                <Eye size={24} color="white" style={{ marginBottom: 12 }} />
                <Text className="text-white text-3xl font-bold mb-1">156.0K</Text>
                <Text className="text-white/80 text-sm">Vues totales</Text>
              </LinearGradient>
            </MotiView>
          </View>
        </View>

        {/* SECTION: Analyser ma vidéo (Bloc Central) */}
        <View className="px-6 mb-6">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAnalyze}
            >
              <GlassCard
                variant="highlight"
                className="p-5 flex-row items-center"
              >
                {/* Icône Sparkles */}
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mr-4"
                  style={{
                    backgroundColor: 'rgba(143, 91, 255, 0.2)',
                    borderWidth: 1.5,
                    borderColor: 'rgba(143, 91, 255, 0.4)',
                  }}
                >
                  <Sparkles size={24} color="#8F5BFF" />
                </View>

                {/* Texte */}
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-1">
                    Analyser ma vidéo
                  </Text>
                  <Text className="text-gray-300 text-xs">
                    IA propriétaire • Résultats instantanés
                  </Text>
                </View>

                {/* Flèche */}
                <ChevronRight size={24} color="white" />
              </GlassCard>
            </TouchableOpacity>
          </MotiView>
        </View>

        {/* SECTION: Calendrier */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Calendrier</Text>
          <View className="flex-row justify-between">
            {calendarDays.map((item, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 400 + index * 50 }}
                className="items-center"
                style={{ flex: 1 }}
              >
                <View className="items-center">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-white text-sm font-medium">{item.day}</Text>
                    {item.active && (
                      <Sparkles size={12} color="#8F5BFF" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text className="text-white text-lg font-bold mb-1">{item.date}</Text>
                  {!item.active && (
                    <View className="w-1.5 h-1.5 rounded-full bg-[#8F5BFF]" />
                  )}
                </View>
              </MotiView>
            ))}
          </View>
        </View>

        {/* SECTION: Objectif hebdomadaire */}
        <View className="px-6 mb-6">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 600 }}
          >
            <GlassCard variant="default" className="p-5">
              <Text className="text-white text-lg font-semibold mb-4">
                Objectif hebdomadaire
              </Text>

              {/* Barre de progression */}
              <View className="mb-3">
                <View
                  className="h-3 rounded-full overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <LinearGradient
                    colors={['#8F5BFF', '#D946EF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: '66.66%', // 2/3
                      height: '100%',
                      borderRadius: 9999,
                    }}
                  />
                </View>
              </View>

              {/* Badge 2/3 + Texte */}
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-300 text-sm">
                  Plus que 1 vidéo(s) à publier
                </Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(143, 91, 255, 0.2)',
                    borderWidth: 1,
                    borderColor: 'rgba(143, 91, 255, 0.4)',
                  }}
                >
                  <Text className="text-white font-bold text-sm">2/3</Text>
                </View>
              </View>
            </GlassCard>
          </MotiView>
        </View>

        {/* SECTION: Dernières analyses (optionnel) */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Dernières analyses</Text>
          <GlassCard variant="subtle" className="p-5">
            <Text className="text-gray-400 text-sm text-center">
              Aucune analyse récente
            </Text>
          </GlassCard>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

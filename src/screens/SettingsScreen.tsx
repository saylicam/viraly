import React from 'react';
import { View, Text, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import * as Haptics from 'expo-haptics';
import { 
  Bell, 
  Moon, 
  Shield, 
  LogOut, 
  Trash2, 
  RefreshCw,
  ChevronRight,
  Smartphone,
  HelpCircle
} from 'lucide-react-native';

import { ScreenBackground } from '../components/ui/ScreenBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { useAuth } from '../hooks/useAuth';

// Clé utilisée pour le premier lancement
const FIRST_LAUNCH_KEY = '@viraly_first_launch';

export default function SettingsScreen({ navigation }: any) {
  const { user, setUser } = useAuth();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);

  const handleResetProfile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Réinitialisation Système",
      "Tu vas effacer ton profil et recommencer l'aventure à zéro. Confirmes-tu ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "CONFIRMER LE RESET", 
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Déconnecter l'utilisateur Firebase (si connecté)
              if (user && !user.isGuest) {
                try {
                  await signOut(auth);
                } catch (error) {
                  console.warn('Erreur lors de la déconnexion Firebase:', error);
                }
              }

              // 2. Réinitialiser l'utilisateur dans le contexte (supprime guest aussi)
              setUser(null);

              // 3. Effacer les données AsyncStorage
              await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
              // Optionnel : effacer toutes les données
              // await AsyncStorage.clear();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              // 4. Redémarrer l'app sur la première page (Splash)
              // Reset de la navigation pour empêcher le retour arrière
              navigation.reset({
                index: 0,
                routes: [{ name: 'Splash' }],
              });
            } catch (e) {
              console.error('Erreur lors du reset:', e);
              Alert.alert("Erreur", "Impossible de réinitialiser.");
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Déconnexion",
      "Tu veux te déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive",
          onPress: async () => {
            try {
              // Déconnecter Firebase (si connecté)
              if (user && !user.isGuest) {
                await signOut(auth);
              }
              
              // Réinitialiser l'utilisateur
              setUser(null);

              // Rediriger vers Splash
              navigation.reset({
                index: 0,
                routes: [{ name: 'Splash' }],
              });
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert("Erreur", "Impossible de se déconnecter.");
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon: Icon, label, value, onToggle, isLink = false, color = "#8B5CF6" }: any) => (
    <View className="flex-row items-center justify-between py-4 border-b border-white/5">
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center mr-3">
          <Icon size={16} color={color} />
        </View>
        <Text className="text-white font-medium text-base">{label}</Text>
      </View>
      
      {isLink ? (
        <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
      ) : (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#1E1B3A', true: '#8B5CF6' }}
          thumbColor={value ? '#FFFFFF' : '#71717A'}
        />
      )}
    </View>
  );

  return (
    <ScreenBackground>
      <ScrollView 
        className="flex-1 px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-1">
            Système
          </Text>
          <Text className="text-3xl font-black text-white">
            Réglages
          </Text>
        </View>

        {/* Section Application */}
        <View className="mb-6">
          <Text className="text-neon-cyan text-xs font-bold uppercase mb-3 ml-2">Application</Text>
          <GlassCard className="px-4 py-2">
            <SettingItem 
              icon={Bell} 
              label="Notifications" 
              value={notifications} 
              onToggle={setNotifications} 
            />
            <SettingItem 
              icon={Moon} 
              label="Mode Sombre" 
              value={darkMode} 
              onToggle={setDarkMode} 
              color="#EC4899"
            />
          </GlassCard>
        </View>

        {/* Section Support */}
        <View className="mb-6">
          <Text className="text-neon-cyan text-xs font-bold uppercase mb-3 ml-2">Support</Text>
          <GlassCard className="px-4 py-2">
            <TouchableOpacity>
              <SettingItem icon={HelpCircle} label="Centre d'aide" isLink color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity>
              <SettingItem icon={Shield} label="Confidentialité" isLink color="#F59E0B" />
            </TouchableOpacity>
            <TouchableOpacity>
              <SettingItem icon={Smartphone} label="Version App v1.0.2" isLink color="#64748B" />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* DANGER ZONE */}
        <View className="mt-4">
          <Text className="text-neon-ruby text-xs font-bold uppercase mb-3 ml-2">Zone Critique</Text>
          <GlassCard className="p-6" variant="highlight">
            <Text className="text-white font-bold text-lg mb-2">Réinitialisation</Text>
            <Text className="text-gray-400 text-sm mb-6 leading-5">
              Si tu souhaites refaire le questionnaire d'onboarding ou recommencer à zéro, utilise cette option.
            </Text>
            
            <NeonButton
              title="RESET PROFIL & INTRO"
              onPress={handleResetProfile}
              variant="danger"
              icon={RefreshCw}
              fullWidth
            />

            <View className="h-4" />

            <TouchableOpacity 
              className="flex-row items-center justify-center py-3"
              onPress={handleLogout}
            >
              <LogOut size={16} color="#F43F5E" style={{ marginRight: 8 }} />
              <Text className="text-neon-ruby font-bold">Se déconnecter</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>

        <Text className="text-center text-white/20 text-xs mt-8 mb-4">
          Viraly AI - Build 2024.11.23
        </Text>

      </ScrollView>
    </ScreenBackground>
  );
}

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { auth } from '../../firebase';
import * as Haptics from 'expo-haptics';
import { Crown, ChevronRight, PenLine, Sparkles } from 'lucide-react-native';
import { deleteAccount } from '../services/authService';
import { useRevenueCat } from '../context/RevenueCatContext';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../context/SessionContext';
import { OnboardingBackground } from '../components/onboarding/OnboardingUI';
import {
  useCreatorProfile, firstName, profileToAnswers,
  LEVEL_LABELS, GOAL_LABELS, BLOCKER_LABELS, FREQUENCY_LABELS, nichesLabel,
} from '../services/creatorProfile';
import { useAnalysisHistory, historyStats, clearAnalysisHistory } from '../services/analysisHistory';
import { clearAccountAudit } from '../services/accountAudit';

const PINK = '#FF4FF9';
const CARD_BG = '#1B0730';
const CARD_BORDER = 'rgba(179, 113, 255, 0.3)';
const SUPPORT_URL = 'https://viraly-production-b0cd.up.railway.app/support';
const PRIVACY_URL = 'https://viraly-production-b0cd.up.railway.app/confidentialite';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

interface ProfileScreenProps {
  navigation: any;
}

const Row = ({ icon, color, label, value, onPress, danger }: {
  icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value?: string; onPress?: () => void; danger?: boolean;
}) => (
  <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} disabled={!onPress} onPress={onPress} style={styles.row}>
    <View style={[styles.rowIcon, { backgroundColor: `${color}1F` }]}><Ionicons name={icon} size={18} color={color} /></View>
    <Text style={[styles.rowLabel, danger && { color: '#FF6B8A' }]}>{label}</Text>
    {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    {onPress ? <ChevronRight size={16} color="rgba(255,255,255,0.35)" /> : null}
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { signOut } = useSession();
  const { isPremium, restorePurchases } = useRevenueCat();
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { profile } = useCreatorProfile();
  const stats = historyStats(useAnalysisHistory());
  const name = firstName(profile);
  const version = Constants.expoConfig?.version ?? '';

  const runDeleteAccount = async (password?: string) => {
    setIsDeleting(true);
    try {
      await deleteAccount({ password });
      // Compte supprimé : on termine la session proprement (RevenueCat + données du téléphone).
      // L'app revient d'elle-même à l'écran d'accueil.
      await signOut().catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Compte supprimé', 'Ton compte et tes données ont été supprimés définitivement.');
    } catch (error: any) {
      if (error?.code !== 'auth/cancelled') {
        Alert.alert('Suppression impossible', error?.message || 'Réessaie plus tard.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const providerId = auth.currentUser?.providerData?.[0]?.providerId;
    Alert.alert(
      'Supprimer mon compte',
      "Ton compte, ton profil et ton calendrier seront supprimés définitivement. Cette action est irréversible."
        + (isPremium
          ? "\n\nAttention : ton abonnement n'est pas annulé automatiquement. Annule-le dans les réglages de ton iPhone (Abonnements)."
          : ''),
      [
        { text: 'Annuler', style: 'cancel' },
        ...(isPremium
          ? [{ text: 'Gérer mon abonnement', onPress: () => Linking.openURL('https://apps.apple.com/account/subscriptions') }]
          : []),
        {
          text: 'Supprimer',
          style: 'destructive' as const,
          onPress: () => {
            if (providerId === 'password') {
              Alert.prompt(
                'Confirme ton mot de passe',
                'Pour ta sécurité, entre ton mot de passe.',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: (value?: string) => runDeleteAccount(value || '') },
                ],
                'secure-text'
              );
            } else {
              runDeleteAccount();
            }
          },
        },
      ]
    );
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Paywall');
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Premium retrouvé ✨', 'Ton abonnement est actif sur ce compte.');
      } else {
        Alert.alert('Aucun abonnement trouvé', "Aucun abonnement actif n'est lié à ton identifiant Apple.");
      }
    } catch {
      Alert.alert('Oups', 'La restauration a échoué. Vérifie ta connexion et réessaie.');
    } finally {
      setRestoring(false);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Déconnexion",
      "Tu veux te déconnecter ? Tu retrouveras ton profil et ton abonnement en te reconnectant.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            try {
              // RevenueCat, Firebase, puis données du téléphone : l'app revient d'elle-même au début
              await signOut();
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert("Erreur", "Impossible de se déconnecter.");
            }
          }
        }
      ]
    );
  };

  const lastLabel = stats.daysSinceLast == null ? '—' : stats.daysSinceLast === 0 ? 'Auj.' : `${stats.daysSinceLast} j`;
  const meta = [profile?.level ? LEVEL_LABELS[profile.level] : null, nichesLabel(profile?.niches)].filter(Boolean).join(' · ');

  return (
    <View style={styles.root}>
      <OnboardingBackground />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profil</Text>

        {/* Identité */}
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
          <LinearGradient colors={['rgba(255,79,249,0.18)', 'rgba(144,19,254,0.14)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.identity}>
            <View style={styles.identityTop}>
              <LinearGradient colors={[PINK, '#9013FE']} style={styles.avatar}>
                <Text style={styles.avatarText}>{(name || 'V').slice(0, 1).toUpperCase()}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{name || 'Créateur'}</Text>
                {meta ? <Text style={styles.meta}>{meta}</Text> : null}
                {user?.email ? <Text style={styles.email} numberOfLines={1}>{user.email}</Text> : null}
              </View>
            </View>
            {profile?.goal || profile?.blocker ? (
              <View style={styles.tags}>
                {profile?.goal ? <View style={styles.tag}><Text style={styles.tagText}>🎯 {GOAL_LABELS[profile.goal]}</Text></View> : null}
                {profile?.frequency ? <View style={styles.tag}><Text style={styles.tagText}>📅 {FREQUENCY_LABELS[profile.frequency]}</Text></View> : null}
              </View>
            ) : null}
            <View style={styles.identityActions}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Questionnaire')} style={styles.identityBtn}>
                <PenLine size={15} color="#FFF" />
                <Text style={styles.identityBtnText}>Modifier mon profil</Text>
              </TouchableOpacity>
              {profile?.level ? (
                <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Recommendation', { answers: profileToAnswers(profile) })} style={styles.identityBtn}>
                  <Sparkles size={15} color="#FFF" />
                  <Text style={styles.identityBtnText}>Revoir mon plan</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </LinearGradient>
        </MotiView>

        {/* Vrais chiffres */}
        <View style={styles.stats}>
          {[
            { value: String(stats.count), label: stats.count > 1 ? 'Vidéos analysées' : 'Vidéo analysée' },
            { value: stats.average == null ? '—' : `${stats.average}`, label: 'Note moyenne' },
            { value: stats.best == null ? '—' : `${stats.best}`, label: 'Meilleure note' },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
        {stats.count ? <Text style={styles.statsNote}>Dernière analyse : {lastLabel === 'Auj.' ? 'aujourd’hui' : `il y a ${lastLabel}`}</Text> : null}

        {profile?.blocker ? (
          <View style={styles.focus}>
            <Text style={styles.focusLabel}>Ta priorité du moment</Text>
            <Text style={styles.focusText}>{BLOCKER_LABELS[profile.blocker]}</Text>
          </View>
        ) : null}

        {/* Compte TikTok */}
        <Text style={styles.section}>TikTok</Text>
        <View style={styles.group}>
          <Row
            icon="logo-tiktok"
            color={PINK}
            label={profile?.tiktok ? 'Bilan de mon compte' : 'Relier mon compte TikTok'}
            value={profile?.tiktok ? `@${profile.tiktok}` : undefined}
            onPress={() => navigation.navigate('AccountReport')}
          />
        </View>

        {/* Abonnement */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={isPremium ? () => Linking.openURL('https://apps.apple.com/account/subscriptions') : handleUpgrade}
          style={styles.premium}
        >
          <View style={styles.premiumIcon}><Crown size={20} color="#FFD84F" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>{isPremium ? 'Viraly Premium ✨' : 'Version gratuite'}</Text>
            <Text style={styles.premiumText}>
              {isPremium ? 'Analyses illimitées et résultats complets.' : 'Passe à Premium : analyses, plans et tendances sans limite.'}
            </Text>
          </View>
          <View style={styles.premiumBtn}><Text style={styles.premiumBtnText}>{isPremium ? 'Gérer' : 'Découvrir'}</Text></View>
        </TouchableOpacity>

        {!isPremium ? (
          <View style={[styles.group, { marginTop: 12 }]}>
            <Row icon="refresh-circle-outline" color="#FFD84F" label={restoring ? 'Restauration…' : 'Restaurer mes achats'} onPress={restoring ? undefined : handleRestore} />
          </View>
        ) : null}

        {/* Aide */}
        <Text style={styles.section}>Aide</Text>
        <View style={styles.group}>
          <Row icon="help-circle-outline" color="#4FC3FF" label="Centre d’aide" onPress={() => Linking.openURL(SUPPORT_URL)} />
          <Row icon="shield-checkmark-outline" color="#42FFB0" label="Confidentialité" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <Row icon="document-text-outline" color="#B371FF" label="Conditions d’utilisation" onPress={() => Linking.openURL(TERMS_URL)} />
          <Row icon="phone-portrait-outline" color="#A1A1AA" label="Version" value={version} />
        </View>

        {/* Compte */}
        <Text style={styles.section}>Compte</Text>
        <View style={styles.group}>
          <Row icon="log-out-outline" color="#FF6B8A" label="Se déconnecter" onPress={handleLogout} danger />
          <Row icon="trash-outline" color="#FF6B8A" label={isDeleting ? 'Suppression…' : 'Supprimer mon compte'} onPress={isDeleting ? undefined : handleDeleteAccount} danger />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0214' },
  scroll: { paddingHorizontal: 22, paddingBottom: 130 },
  title: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 18 },

  identity: { borderRadius: 26, padding: 18, borderWidth: 1.4, borderColor: 'rgba(255,79,249,0.4)' },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  name: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  meta: { color: 'rgba(234,226,247,0.75)', fontSize: 14, marginTop: 3 },
  email: { color: 'rgba(234, 226, 247, 0.45)', fontSize: 12, marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(10,2,20,0.45)' },
  tagText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  identityActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  identityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  identityBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 20, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  statValue: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  statLabel: { color: 'rgba(234,226,247,0.6)', fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  statsNote: { color: 'rgba(234,226,247,0.5)', fontSize: 12, textAlign: 'center', marginTop: 8 },

  focus: { marginTop: 14, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,79,249,0.08)', borderWidth: 1, borderColor: 'rgba(255,79,249,0.35)' },
  focusLabel: { color: PINK, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  focusText: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 4 },

  premium: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, padding: 16, borderRadius: 22, backgroundColor: CARD_BG, borderWidth: 1, borderColor: 'rgba(255,216,79,0.35)' },
  premiumIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,216,79,0.15)', alignItems: 'center', justifyContent: 'center' },
  premiumTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  premiumText: { color: 'rgba(234,226,247,0.65)', fontSize: 13, marginTop: 2, lineHeight: 18 },
  premiumBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: PINK },
  premiumBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  section: { color: 'rgba(234,226,247,0.6)', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 26, marginBottom: 10, marginLeft: 4 },
  group: { borderRadius: 22, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(179,113,255,0.18)' },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '600' },
  rowValue: { color: 'rgba(234,226,247,0.55)', fontSize: 14 },
});

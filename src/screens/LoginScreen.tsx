import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Image, Linking } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Check, ChevronLeft } from 'lucide-react-native';
import { EmailAuthModal } from '../components/EmailAuthModal';
import { signInWithApple } from '../services/authService';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { OnboardingShell, TextLink, OB } from '../components/onboarding/OnboardingUI';

const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const IS_DEV_VARIANT = Constants.expoConfig?.extra?.appVariant === 'development';
const DEV_SETUP_HINT = "Viraly Dev doit d'abord être ajoutée dans Firebase (app iOS com.viraly.app.dev). En attendant, connecte-toi avec un e-mail.";
const PRIVACY_URL = 'https://viraly-production-b0cd.up.railway.app/confidentialite';

const BENEFITS = [
  'Ton plan personnalisé sauvegardé',
  'Ton profil et ton calendrier sur tous tes appareils',
  'Les tendances de ta niche chaque semaine',
];

interface LoginScreenProps {
  navigation: any;
  route?: {
    params?: {
      answers?: Record<string, string[]>;
      mode?: 'login' | 'signup';
    };
  };
}

export default function LoginScreen({ navigation, route }: LoginScreenProps) {
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { loginWithGoogle, ready: googleReady } = useGoogleAuth();
  const questionnaireAnswers = route?.params?.answers;
  const isLoginMode = route?.params?.mode === 'login' && !questionnaireAnswers;
  const firstName = (questionnaireAnswers?.name?.[0] ?? '').trim().split(/\s+/)[0];


  // Vérifier si Apple Sign In est disponible
  useEffect(() => {
    const checkAppleAuth = async () => {
      if (Platform.OS === 'ios') {
        const isAvailable = await AppleAuthentication.isAvailableAsync();
        setAppleAvailable(isAvailable);
      }
    };
    checkAppleAuth();
  }, []);


  // Pas de navigation ici : dès que la connexion réussit, la session choisit l'écran suivant
  // (accueil si le compte a déjà un profil, sinon enregistrement du questionnaire puis Premium).

  const handleAppleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const userData = await signInWithApple();
      
      console.log('✅ Utilisateur connecté avec Apple:', userData);
      
      // La session prend le relais (profil du compte ou questionnaire à enregistrer)
    } catch (err: any) {
      console.warn('Connexion Apple :', err?.message ?? err);
      
      // Ne pas afficher d'erreur si l'utilisateur a annulé
      if (err.code !== 'auth/cancelled') {
        const audience = /audience/i.test(String(err?.message ?? err?.originalError?.message ?? ''));
        setError(IS_DEV_VARIANT && audience ? DEV_SETUP_HINT : 'La connexion avec Apple a échoué. Réessaie.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Viraly Dev sans client Google à elle : Google refuserait (redirect_uri_mismatch)
    if (Constants.expoConfig?.extra?.googleDevClientMissing) {
      setError(DEV_SETUP_HINT);
      return;
    }
    try {
      setError(null);
      setGoogleLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const userData = await loginWithGoogle();
      if (userData) {
        console.log('✅ Utilisateur connecté avec Google:', userData.uid);
        // La session prend le relais (profil du compte ou questionnaire à enregistrer)
      }
    } catch (err: any) {
      console.warn('Connexion Google :', err?.message ?? err);
      setError('La connexion avec Google a échoué. Réessaie.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuthSuccess = async () => {
    setEmailModalVisible(false);
    // La session prend le relais (profil du compte ou questionnaire à enregistrer)
  };

  const busy = loading || googleLoading;

  return (
    <OnboardingShell
      contentStyle={{ justifyContent: 'center' }}
      footer={
        <Text style={styles.legal}>
          En continuant, tu acceptes les{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>conditions d’utilisation</Text>
          {' '}et la{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>politique de confidentialité</Text>.
        </Text>
      }
    >
      {navigation.canGoBack() ? (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
      ) : null}

      <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} style={styles.header}>
        <View style={styles.logoGlow}>
          <Image source={require('../../assets/logo-mark.png')} style={styles.logo} />
        </View>
        <Text style={styles.title}>
          {isLoginMode ? 'Content de te revoir' : firstName ? `Sauvegarde ton plan, ${firstName}` : 'Crée ton compte'}
        </Text>
        <Text style={styles.subtitle}>
          {isLoginMode
            ? 'Connecte-toi pour retrouver tes analyses, ton plan et ton calendrier.'
            : 'Un compte gratuit, en un geste. Pas de mot de passe à retenir avec Apple ou Google.'}
        </Text>
      </MotiView>

      {!isLoginMode ? (
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 150 }} style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefit}>
              <View style={styles.benefitCheck}><Check size={13} color="#FFF" strokeWidth={3} /></View>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </MotiView>
      ) : null}

      <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 250 }} style={styles.buttons}>
        {appleAvailable ? (
          loading ? (
            <View style={[styles.btn, styles.btnWhite]}><ActivityIndicator color="#000" /></View>
          ) : (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={isLoginMode ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN : AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={28}
              style={styles.appleBtn}
              onPress={handleAppleLogin}
            />
          )
        ) : null}

        <TouchableOpacity onPress={handleGoogleLogin} disabled={busy || !googleReady} activeOpacity={0.85} style={[styles.btn, appleAvailable ? styles.btnOutline : styles.btnWhite]}>
          {googleLoading ? <ActivityIndicator color={appleAvailable ? '#FFF' : '#000'} /> : (
            <>
              <Ionicons name="logo-google" size={20} color={appleAvailable ? '#FFF' : '#1F1F1F'} />
              <Text style={[styles.btnText, !appleAvailable && { color: '#1F1F1F' }]}>Continuer avec Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEmailModalVisible(true); }}
          disabled={busy}
          activeOpacity={0.85}
          style={[styles.btn, styles.btnOutline]}
        >
          <Ionicons name="mail-outline" size={20} color="#FFF" />
          <Text style={styles.btnText}>Continuer avec un e-mail</Text>
        </TouchableOpacity>

        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle" size={18} color="#FF6B8A" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

      </MotiView>

      <EmailAuthModal
        visible={emailModalVisible}
        onClose={() => setEmailModalVisible(false)}
        onSuccess={handleEmailAuthSuccess}
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 60, left: 24, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  header: { alignItems: 'center' },
  logoGlow: {
    borderRadius: 28, shadowColor: OB.pink, shadowOpacity: 0.6, shadowRadius: 26, shadowOffset: { width: 0, height: 0 }, elevation: 12,
  },
  logo: { width: 88, height: 88, borderRadius: 26 },
  title: { color: '#FFF', fontSize: 28, lineHeight: 34, fontWeight: '900', textAlign: 'center', marginTop: 22, letterSpacing: -0.3 },
  subtitle: { color: OB.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },

  benefits: { gap: 12, marginTop: 26, padding: 16, borderRadius: 20, backgroundColor: OB.card, borderWidth: 1, borderColor: OB.border },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
  benefitText: { color: '#FFF', fontSize: 15, fontWeight: '600', flex: 1 },

  buttons: { gap: 12, marginTop: 26 },
  appleBtn: { width: '100%', height: 56 },
  btn: { height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnWhite: { backgroundColor: '#FFFFFF' },
  btnOutline: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.04)' },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  error: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,107,138,0.12)', borderWidth: 1, borderColor: 'rgba(255,107,138,0.35)' },
  errorText: { color: '#FFD5DE', fontSize: 13, flex: 1, lineHeight: 18 },

  legal: { color: OB.faint, fontSize: 12, lineHeight: 17, textAlign: 'center', paddingHorizontal: 12 },
  legalLink: { color: OB.muted, textDecorationLine: 'underline' },
});

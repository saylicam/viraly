import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { OnboardingShell, PrimaryButton, TextLink, OB } from '../components/onboarding/OnboardingUI';

/**
 * Écran d'ouverture : pendant qu'on relit la session et le profil du compte.
 * Si le profil ne peut pas être relu (pas de réseau), on propose de réessayer
 * plutôt que de renvoyer l'utilisateur au questionnaire.
 */
export default function BootScreen({ error, onRetry, onSignOut }: { error?: boolean; onRetry?: () => void; onSignOut?: () => void }) {
  return (
    <OnboardingShell
      contentStyle={styles.center}
      footer={error ? (
        <>
          <PrimaryButton label="Réessayer" onPress={() => onRetry?.()} />
          {onSignOut ? <TextLink label="Me déconnecter" onPress={onSignOut} /> : null}
        </>
      ) : undefined}
    >
      <Image source={require('../../assets/logo-mark.png')} style={styles.logo} />
      {error ? (
        <View style={styles.errorBox}>
          <WifiOff size={26} color={OB.pink} />
          <Text style={styles.title}>Connexion impossible</Text>
          <Text style={styles.text}>On n’arrive pas à récupérer ton compte. Vérifie ta connexion internet, puis réessaie.</Text>
        </View>
      ) : (
        <ActivityIndicator color={OB.pink} size="large" style={{ marginTop: 28 }} />
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  logo: { width: 84, height: 84, borderRadius: 24 },
  errorBox: { alignItems: 'center', marginTop: 28, gap: 10, paddingHorizontal: 8 },
  title: { color: '#FFF', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  text: { color: OB.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});

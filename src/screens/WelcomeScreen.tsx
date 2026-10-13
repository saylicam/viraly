import React from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Flame, Wand2, Gauge, ArrowRight, Music2, CheckCircle2 } from 'lucide-react-native';
import { OnboardingShell, PrimaryButton, TextLink, OB } from '../components/onboarding/OnboardingUI';

interface WelcomeScreenProps {
  navigation: any;
}

const FEATURES = [
  { Icon: Flame, color: '#FFB84F', title: 'Les tendances de ta niche', text: 'Sons, vidéos et hashtags qui explosent, chaque semaine' },
  { Icon: Wand2, color: OB.pink, title: 'Un plan pour les refaire', text: 'Accroche, plans et légende, adaptés à toi' },
  { Icon: Gauge, color: '#4FC3FF', title: 'Une note avant de publier', text: 'L’IA te dit quoi corriger pour percer' },
];

/** Petite illustration de ce que fait l'app (pas des données réelles). */
const DemoCard = () => (
  <MotiView
    from={{ opacity: 0, translateY: 16, rotate: '-2deg' }}
    animate={{ opacity: 1, translateY: 0, rotate: '-2deg' }}
    transition={{ type: 'timing', duration: 700, delay: 250 }}
    style={styles.demoWrap}
  >
    <LinearGradient colors={['rgba(255,79,249,0.20)', 'rgba(144,19,254,0.18)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.demo}>
      <View style={styles.demoTop}>
        <View style={styles.scoreRing}><Text style={styles.scoreValue}>88</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.demoTitle}>Vidéo excellente</Text>
          <Text style={styles.demoSub}>Prête à publier</Text>
        </View>
      </View>
      <View style={styles.demoRow}>
        <View style={styles.demoChip}><Music2 size={12} color="#42FFB0" /><Text style={[styles.demoChipText, { color: '#42FFB0' }]}>Son tendance +240 %</Text></View>
        <View style={styles.demoChip}><CheckCircle2 size={12} color="#FFD84F" /><Text style={[styles.demoChipText, { color: '#FFD84F' }]}>Accroche validée</Text></View>
      </View>
    </LinearGradient>
  </MotiView>
);

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { height } = useWindowDimensions();
  const compact = height < 720; // iPhone SE / mini : on retire l'illustration

  return (
    <OnboardingShell
      footer={
        <>
          <PrimaryButton label="Commencer" onPress={() => navigation.navigate('Questionnaire')} icon={<ArrowRight size={20} color="#FFF" />} />
          <Text style={styles.reassure}>Gratuit · 1 minute pour personnaliser ton coaching</Text>
          <TextLink label="J’ai déjà un compte" onPress={() => navigation.navigate('Login', { mode: 'login' })} />
        </>
      }
      contentStyle={{ justifyContent: 'space-between' }}
    >
      <View>
        <MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }} style={styles.brandRow}>
          <Image source={require('../../assets/logo-mark.png')} style={styles.logo} />
          <Text style={styles.brand}>Viraly</Text>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 100 }}>
          <Text style={[styles.title, compact && { fontSize: 32, lineHeight: 37 }]}>
            Fais exploser{'\n'}<Text style={styles.titleAccent}>tes vidéos.</Text>
          </Text>
          <Text style={styles.subtitle}>Ton coach IA pour TikTok et Reels : il te dit quoi filmer, comment, et si c’est prêt.</Text>
        </MotiView>
      </View>

      {!compact ? <DemoCard /> : null}

      <View style={styles.features}>
        {FEATURES.map(({ Icon, color, title, text }, i) => (
          <MotiView key={title} from={{ opacity: 0, translateX: -10 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: 350 + i * 90 }} style={styles.feature}>
            <View style={[styles.featureIcon, { backgroundColor: `${color}22` }]}><Icon size={20} color={color} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          </MotiView>
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  logo: { width: 40, height: 40, borderRadius: 12 },
  brand: { color: '#FFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },

  title: { color: '#FFF', fontSize: 38, lineHeight: 43, fontWeight: '900', marginTop: 28, letterSpacing: -0.5 },
  titleAccent: { color: OB.pink },
  subtitle: { color: OB.muted, fontSize: 16, lineHeight: 23, marginTop: 12 },

  demoWrap: { alignSelf: 'center', width: '88%' },
  demo: { borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 79, 249, 0.4)' },
  demoTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 5, borderColor: '#42FFB0', alignItems: 'center', justifyContent: 'center' },
  scoreValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  demoTitle: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  demoSub: { color: OB.muted, fontSize: 13, marginTop: 2 },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  demoChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(10,2,20,0.55)' },
  demoChipText: { fontSize: 12, fontWeight: '800' },

  features: { gap: 14, marginBottom: 8 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  featureText: { color: OB.faint, fontSize: 13, marginTop: 2, lineHeight: 18 },

  reassure: { color: OB.faint, fontSize: 13, textAlign: 'center', marginTop: 12 },
});

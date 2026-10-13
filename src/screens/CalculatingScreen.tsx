import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { OnboardingShell, OB } from '../components/onboarding/OnboardingUI';
import { NICHE_LABELS, GOAL_LABELS } from '../services/creatorProfile';

interface CalculatingScreenProps {
  navigation: any;
  route: { params: { answers: Record<string, string[]> } };
}

const DURATION = 5200; // un seul chrono pour la barre, le pourcentage et les étapes

export default function CalculatingScreen({ navigation, route }: CalculatingScreenProps) {
  const answers = route.params?.answers ?? {};
  const name = (answers.name?.[0] ?? '').trim().split(/\s+/)[0];
  const niche = NICHE_LABELS[answers.niches?.[0] ?? ''];
  const goal = GOAL_LABELS[answers.goal?.[0] ?? ''];

  const steps = useMemo(() => [
    name ? `On analyse ton profil, ${name}` : 'On analyse ton profil',
    ...(answers.tiktok?.[0] ? [`On lit ton compte @${answers.tiktok[0]}`] : []),
    niche ? `On regarde les tendances ${niche} de la semaine` : 'On regarde les tendances de la semaine',
    goal ? `On cible ton objectif : ${goal.toLowerCase()}` : 'On adapte les conseils à ton objectif',
    'On prépare ton calendrier',
  ], [name, niche, goal, answers.tiktok?.[0]]);

  const progress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = progress.addListener(({ value }) => setPercent(Math.round(value * 100)));
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    Animated.timing(progress, { toValue: 1, duration: DURATION, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(({ finished }) => {
      if (!finished) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => navigation.replace('Recommendation', { answers }), 450);
    });
    return () => { progress.removeListener(id); loop.stop(); progress.stopAnimation(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Étape courante déduite du même pourcentage : 0-24 % → 1, 25-49 % → 2, etc.
  const current = Math.min(steps.length - 1, Math.floor(percent / (100 / steps.length)));
  const lastStep = useRef(-1);
  useEffect(() => {
    if (current !== lastStep.current) {
      lastStep.current = current;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [current]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <OnboardingShell contentStyle={{ justifyContent: 'center' }}>
      <View style={styles.orbWrap}>
        <Animated.View style={[styles.orbRing, { transform: [{ rotate }] }]}>
          <LinearGradient colors={[OB.pink, 'transparent', OB.lilac, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View style={styles.orbInner}>
          <Image source={require('../../assets/logo-mark.png')} style={styles.logo} />
        </View>
      </View>

      <Text style={styles.title}>On crée ton plan</Text>
      <Text style={styles.subtitle}>Quelques secondes, on personnalise tout pour toi</Text>

      <View style={styles.barRow}>
        <View style={styles.bar}>
          <Animated.View style={[styles.barFill, { width }]}>
            <LinearGradient colors={[OB.violet, OB.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
        <Text style={styles.percent}>{percent} %</Text>
      </View>

      <View style={styles.steps}>
        {steps.map((s, i) => {
          const done = percent >= 100 || i < current;
          const active = i === current && !done;
          return (
            <MotiView key={i} animate={{ opacity: i <= current ? 1 : 0.35 }} transition={{ type: 'timing', duration: 300 }} style={styles.step}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done ? <Check size={14} color="#FFF" strokeWidth={3} /> : active ? <View style={styles.pulse} /> : null}
              </View>
              <Text style={[styles.stepText, (done || active) && { color: '#FFF' }]}>{s}</Text>
            </MotiView>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  orbWrap: { alignSelf: 'center', width: 132, height: 132, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  orbRing: { position: 'absolute', width: 132, height: 132, borderRadius: 66, overflow: 'hidden', opacity: 0.9 },
  orbInner: { width: 118, height: 118, borderRadius: 59, backgroundColor: OB.bg, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 92, height: 92, borderRadius: 46 },

  title: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: OB.muted, fontSize: 15, textAlign: 'center', marginTop: 8 },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 30, marginBottom: 30 },
  bar: { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5, overflow: 'hidden' },
  percent: { color: '#FFF', fontSize: 16, fontWeight: '800', width: 52, textAlign: 'right' },

  steps: { gap: 18 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  dotActive: { borderColor: OB.pink },
  dotDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: OB.pink },
  stepText: { flex: 1, color: OB.muted, fontSize: 16, fontWeight: '600' },
});

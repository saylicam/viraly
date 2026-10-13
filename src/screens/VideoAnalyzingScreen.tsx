import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Alert, Easing, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { MotiView } from 'moti';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Zap, Scissors, Video, Music2, MessageCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiService } from '../services/api';
import { useRevenueCat } from '../context/RevenueCatContext';
import { useSession } from '../context/SessionContext';
import { recordAnalysis } from '../services/analysisHistory';
import { loadLocalProfile } from '../services/creatorProfile';

interface VideoAnalyzingScreenProps {
  navigation: any;
  route: { params: { videoUri: string } };
}

const PINK = '#FF4FF9';
const VIOLET = '#B371FF';

/** Étapes réelles du traitement (temps approximatifs, la dernière dure jusqu'à la réponse). */
const STEPS = [
  { at: 0, label: 'Envoi de ta vidéo' },
  { at: 4, label: 'L’IA regarde ta vidéo en entier' },
  { at: 11, label: 'Accroche et rythme' },
  { at: 18, label: 'Image, son et message' },
  { at: 26, label: 'Rédaction de tes conseils' },
];

/** Ce que l'IA évalue : les badges s'allument au fil de l'analyse. */
const PILLARS = [
  { Icon: Zap, label: 'Accroche', color: PINK, at: 8 },
  { Icon: Scissors, label: 'Rythme', color: '#4FC3FF', at: 12 },
  { Icon: Video, label: 'Image', color: '#42FFB0', at: 16 },
  { Icon: Music2, label: 'Son', color: '#FFD84F', at: 20 },
  { Icon: MessageCircle, label: 'Message', color: VIOLET, at: 24 },
];

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Barres « onde sonore » qui bougent pendant l'analyse. */
const Waveform = () => {
  const bars = useRef(Array.from({ length: 16 }, () => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loops = bars.map((v, i) => Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 0.25 + Math.random() * 0.75, duration: 260 + (i % 5) * 70, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.15 + Math.random() * 0.4, duration: 240 + (i % 3) * 90, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [bars]);
  return (
    <View style={styles.wave}>
      {bars.map((v, i) => (
        <Animated.View key={i} style={[styles.waveBar, { transform: [{ scaleY: v }], backgroundColor: i % 3 === 0 ? PINK : i % 3 === 1 ? VIOLET : '#4FC3FF' }]} />
      ))}
    </View>
  );
};

/** Courbe de rétention qui se dessine en boucle (illustration de ce que l'IA calcule). */
const RetentionSketch = ({ width }: { width: number }) => {
  const h = 54;
  const d = `M0 6 C ${width * 0.12} 8, ${width * 0.18} 20, ${width * 0.3} 22 S ${width * 0.5} 26, ${width * 0.62} 34 S ${width * 0.85} 40, ${width} 46`;
  const len = width * 1.25;
  const dash = useRef(new Animated.Value(len)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(dash, { toValue: 0, duration: 2200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.delay(700),
      Animated.timing(dash, { toValue: len, duration: 0, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [dash, len]);
  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgGradient id="retLine" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#42FFB0" />
          <Stop offset="0.6" stopColor="#FFD84F" />
          <Stop offset="1" stopColor={PINK} />
        </SvgGradient>
      </Defs>
      <AnimatedPath d={d} stroke="url(#retLine)" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={`${len}`} strokeDashoffset={dash as any} />
    </Svg>
  );
};

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function VideoAnalyzingScreen({ navigation, route }: VideoAnalyzingScreenProps) {
  const { isPremium, syncPurchases } = useRevenueCat();
  const { signOut } = useSession();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const videoUri = route.params?.videoUri;
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const scan = useRef(new Animated.Value(0)).current;

  // Chrono
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  // Ligne de scan
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scan, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(scan, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [scan]);

  // Étape courante + pourcentage (même horloge) ; on plafonne à 96 % tant que l'IA n'a pas répondu
  const current = done ? STEPS.length : STEPS.reduce((acc, s, i) => (elapsed >= s.at ? i : acc), 0);
  const percent = done ? 100 : Math.min(96, Math.round(100 * (1 - Math.exp(-elapsed / 16))));
  const lastStep = useRef(-1);
  useEffect(() => {
    if (current !== lastStep.current) {
      lastStep.current = current;
      Haptics.selectionAsync();
    }
  }, [current]);

  const frameH = Math.min(height * 0.36, 330);
  const frameW = frameH * (9 / 16);
  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, frameH - 4] });
  const graphW = (width - 44 - 32) / 2 - 8;

  // Vrai appel API Gemini via le backend
  useEffect(() => {
    if (!videoUri) {
      Alert.alert('Erreur', 'Aucune vidéo à analyser.');
      if (navigation.canGoBack()) navigation.goBack();
      return;
    }

    let cancelled = false;

    const runAnalysis = async () => {
      try {
        console.log('🎬 Démarrage analyse vidéo:', videoUri);

        const healthCheck = await apiService.healthCheck();
        if (cancelled) return;

        if (!healthCheck.success) {
          throw new Error(
            'Serveur inaccessible. Vérifie ta connexion internet et réessaie.'
          );
        }

        const p = await loadLocalProfile().catch(() => null);
        const context = { niche: p?.niches?.[0], level: p?.level, goal: p?.goal };
        let response = await apiService.uploadVideo(videoUri, undefined, context);

        // L'app voit un abonnement mais le serveur non : on renvoie le reçu Apple
        // à RevenueCat pour ce compte, puis on réessaie une fois.
        if (!response.success && response.code === 'FREE_LIMIT_REACHED' && isPremium) {
          const premiumAfterSync = await syncPurchases();
          if (cancelled) return;
          if (premiumAfterSync) {
            response = await apiService.uploadVideo(videoUri, undefined, context);
          }
        }
        if (cancelled) return;

        // Limite gratuite atteinte : on propose Premium
        if (!response.success && response.code === 'FREE_LIMIT_REACHED') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          navigation.replace('Paywall', { source: 'limit' });
          return;
        }

        // Session expirée (jeton refusé même après rafraîchissement) : il faut se reconnecter
        if (!response.success && (response.code === 'AUTH_REQUIRED' || response.code === 'AUTH_INVALID')) {
          Alert.alert('Reconnecte-toi', 'Ta session a expiré. Reconnecte-toi pour analyser tes vidéos : tu retrouveras ton profil et ton abonnement.', [
            { text: 'Plus tard', style: 'cancel', onPress: () => navigation.canGoBack() && navigation.goBack() },
            { text: 'Me reconnecter', onPress: () => { signOut().catch(() => {}); } },
          ]);
          return;
        }

        if (!response.success || !response.data) {
          throw new Error(
            typeof response.error === 'string'
              ? response.error
              : (response as any).error?.message || 'Erreur lors de l\'analyse'
          );
        }

        // Le backend renvoie { success, data: { analysis } } ; apiService enveloppe encore une fois
        const payload: any = response.data;
        let analysisData: any;
        if (payload?.data?.analysis) {
          analysisData = payload.data.analysis;
        } else if (payload?.analysis) {
          analysisData = payload.analysis;
        } else {
          analysisData = payload;
        }

        if (!analysisData || typeof analysisData !== 'object') {
          throw new Error('Réponse d\'analyse invalide');
        }

        const result = {
          ...analysisData,
          potentielViral:
            analysisData.score_sur_100 ??
            analysisData.avis_global?.note_sur_100 ??
            analysisData.potentielViral ??
            70,
          description:
            analysisData.resume_video?.court ||
            analysisData.description_video ||
            analysisData.description ||
            '',
          pointsForts:
            analysisData.pourquoi_ca_perce?.preview ||
            analysisData.analyse_viralite?.points_forts ||
            analysisData.pointsForts ||
            [],
          ameliorations:
            analysisData.pourquoi_ca_floppe?.preview ||
            analysisData.analyse_viralite?.points_faibles ||
            analysisData.ameliorations ||
            [],
        };

        setDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Court délai pour afficher "Analyse terminée" puis naviguer
        setTimeout(() => {
          if (cancelled) return;
          navigation.replace('AnalysisResult', { videoUri, result });
        }, 900);
        // Historique (vrais chiffres de l'accueil et du profil)
        recordAnalysis(videoUri, result).catch(() => {});
      } catch (error: any) {
        if (cancelled) return;
        console.error('❌ Analyse vidéo échouée:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Erreur',
          error?.message || "L'analyse a échoué. Réessaie avec une autre vidéo.",
          [{ text: 'OK', onPress: () => navigation.canGoBack() && navigation.goBack() }]
        );
      }
    };

    runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [route.params?.videoUri, navigation]);

  return (
    <View style={styles.root}>
      {/* Ta vidéo en fond, floutée */}
      {videoUri ? (
        <ExpoVideo source={{ uri: videoUri }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted />
      ) : null}
      <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(10,2,20,0.55)', 'rgba(10,2,20,0.75)', '#0A0214']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />

      <View style={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16 }]}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.kicker}>{done ? 'Terminé' : 'Analyse en cours'}</Text>
            <Text style={styles.title}>{done ? 'Ton résultat est prêt' : 'L’IA décortique ta vidéo'}</Text>
          </View>
          <View style={styles.clock}>
            <View style={[styles.liveDot, done && { backgroundColor: '#42FFB0' }]} />
            <Text style={styles.clockText}>{fmtClock(elapsed)}</Text>
          </View>
        </View>

        {/* Vidéo au scanner + badges */}
        <View style={styles.stage}>
          <View style={styles.pillarsCol}>
            {PILLARS.slice(0, 3).map((p) => {
              const on = done || elapsed >= p.at;
              return (
                <MotiView key={p.label} animate={{ opacity: on ? 1 : 0.28, scale: on ? 1 : 0.92 }} transition={{ type: 'timing', duration: 350 }} style={[styles.pillar, on && { borderColor: p.color }]}>
                  <p.Icon size={14} color={on ? p.color : '#FFF'} />
                  <Text style={styles.pillarText}>{p.label}</Text>
                  {on ? <Check size={12} color={p.color} strokeWidth={3} /> : null}
                </MotiView>
              );
            })}
          </View>

          <View style={[styles.frame, { width: frameW, height: frameH }]}>
            {videoUri ? <ExpoVideo source={{ uri: videoUri }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted /> : null}
            <LinearGradient colors={['rgba(255,79,249,0.12)', 'transparent', 'rgba(144,19,254,0.18)']} style={StyleSheet.absoluteFill} />
            {!done ? (
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]}>
                <LinearGradient colors={['transparent', 'rgba(255,79,249,0.35)', PINK]} style={styles.scanGlow} />
              </Animated.View>
            ) : (
              <MotiView from={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} style={styles.doneBadge}>
                <Check size={34} color="#FFF" strokeWidth={3} />
              </MotiView>
            )}
            {/* Coins du viseur */}
            <View style={[styles.corner, { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.corner, { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3 }]} />
            <View style={[styles.corner, { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
            <View style={[styles.corner, { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3 }]} />
          </View>

          <View style={styles.pillarsCol}>
            {PILLARS.slice(3).map((p) => {
              const on = done || elapsed >= p.at;
              return (
                <MotiView key={p.label} animate={{ opacity: on ? 1 : 0.28, scale: on ? 1 : 0.92 }} transition={{ type: 'timing', duration: 350 }} style={[styles.pillar, on && { borderColor: p.color }]}>
                  <p.Icon size={14} color={on ? p.color : '#FFF'} />
                  <Text style={styles.pillarText}>{p.label}</Text>
                  {on ? <Check size={12} color={p.color} strokeWidth={3} /> : null}
                </MotiView>
              );
            })}
          </View>
        </View>

        {/* Graphiques en direct */}
        <View style={styles.graphs}>
          <View style={styles.graph}>
            <Text style={styles.graphLabel}>Son</Text>
            <Waveform />
          </View>
          <View style={styles.graph}>
            <Text style={styles.graphLabel}>Rétention</Text>
            <RetentionSketch width={graphW} />
          </View>
        </View>

        {/* Progression */}
        <View style={styles.progressCard}>
          <View style={styles.barRow}>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${percent}%` }]}>
                <LinearGradient colors={['#9013FE', PINK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              </View>
            </View>
            <Text style={styles.percent}>{percent} %</Text>
          </View>
          {STEPS.map((s, i) => {
            const isDone = i < current;
            const active = i === current;
            return (
              <View key={s.label} style={[styles.step, !isDone && !active && { opacity: 0.4 }]}>
                <View style={[styles.dot, isDone && styles.dotDone, active && styles.dotActive]}>
                  {isDone ? <Check size={11} color="#FFF" strokeWidth={3.5} /> : active ? <MotiView from={{ scale: 0.6, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ loop: true, type: 'timing', duration: 700 }} style={styles.pulse} /> : null}
                </View>
                <Text style={[styles.stepText, (isDone || active) && { color: '#FFF' }]}>{s.label}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.hint}>{done ? 'Ouverture du résultat…' : 'Reste sur cet écran · environ 30 secondes'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0214' },
  content: { flex: 1, paddingHorizontal: 22, justifyContent: 'space-between' },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  kicker: { color: PINK, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#FFF', fontSize: 23, lineHeight: 28, fontWeight: '900', marginTop: 4 },
  clock: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(10,2,20,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4F6D' },
  clockText: { color: '#FFF', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },

  stage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  pillarsCol: { gap: 10, width: 92 },
  pillar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(10,2,20,0.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  pillarText: { color: '#FFF', fontSize: 12, fontWeight: '800', flex: 1 },
  frame: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#1B0730', borderWidth: 1.5, borderColor: 'rgba(255,79,249,0.55)' },
  scanLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 4 },
  scanGlow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 46 },
  corner: { position: 'absolute', width: 18, height: 18, borderColor: '#FFF', opacity: 0.85 },
  doneBadge: { position: 'absolute', alignSelf: 'center', top: '42%', width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(34,197,94,0.9)', alignItems: 'center', justifyContent: 'center' },

  graphs: { flexDirection: 'row', gap: 12 },
  graph: { flex: 1, padding: 12, borderRadius: 18, backgroundColor: 'rgba(10,2,20,0.6)', borderWidth: 1, borderColor: 'rgba(179,113,255,0.3)', gap: 8 },
  graphLabel: { color: 'rgba(234,226,247,0.65)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  wave: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waveBar: { width: 4, height: 50, borderRadius: 2 },

  progressCard: { padding: 16, borderRadius: 22, backgroundColor: 'rgba(10,2,20,0.65)', borderWidth: 1, borderColor: 'rgba(179,113,255,0.3)', gap: 11 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  bar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  percent: { color: '#FFF', fontSize: 14, fontWeight: '900', width: 44, textAlign: 'right', fontVariant: ['tabular-nums'] },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  dotActive: { borderColor: PINK },
  dotDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: PINK },
  stepText: { color: 'rgba(234,226,247,0.7)', fontSize: 14, fontWeight: '700' },

  hint: { color: 'rgba(234,226,247,0.55)', fontSize: 12, textAlign: 'center' },
});

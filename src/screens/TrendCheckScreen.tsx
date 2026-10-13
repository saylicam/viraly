import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import {
  ChevronLeft, ScanSearch, Zap, CheckCircle2, CircleDashed, XCircle, Wrench, Star, Sparkles,
  RefreshCw, Lock, Film, BarChart3,
} from 'lucide-react-native';
import { apiService } from '../services/api';
import { pickVideo } from '../utils/pickVideo';
import { useAnalysisGate } from '../hooks/useAnalysisGate';

interface CheckResult {
  score: number;
  pret_a_publier: boolean;
  verdict: string;
  accroche: { statut: 'ok' | 'a_corriger'; constat: string; conseil: string };
  etapes: { moment: string; attendu: string; statut: 'ok' | 'partiel' | 'manquant'; commentaire: string }[];
  corrections: { moment: string; probleme: string; solution: string }[];
  points_forts: string[];
  touche_perso: string;
}

const PINK = '#FF4FF9';
const VIOLET = '#B371FF';
const GREEN = '#42FFB0';
const YELLOW = '#FFD84F';
const RED = '#FF6B8A';
const CARD_BG = '#1B0730';
const CARD_BORDER = 'rgba(179, 113, 255, 0.35)';

const STEPS = [
  'Envoi de ta vidéo…',
  'L’IA regarde ton accroche…',
  'On compare avec le plan, étape par étape…',
  'On prépare tes corrections…',
];

const scoreColor = (s: number) => (s >= 75 ? GREEN : s >= 55 ? YELLOW : RED);

const STEP_STATUS = {
  ok: { Icon: CheckCircle2, color: GREEN, label: 'Fait' },
  partiel: { Icon: CircleDashed, color: YELLOW, label: 'À moitié' },
  manquant: { Icon: XCircle, color: RED, label: 'Manquant' },
} as const;

const Card = ({ icon, title, children, delay = 0, accent }: { icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number; accent?: string }) => (
  <MotiView
    from={{ opacity: 0, translateY: 12 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ delay }}
    style={[styles.card, accent ? { borderColor: accent } : null]}
  >
    <View style={styles.cardHeader}>
      {icon}
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </MotiView>
);

export default function TrendCheckScreen({ route, navigation }: any) {
  const { plan, kind, id, title } = route.params;
  const [videoUri, setVideoUri] = useState<string>(route.params.videoUri);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  useEffect(() => {
    if (!loading) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 7000);
    return () => clearInterval(t);
  }, [loading]);

  const run = useCallback(async (uri: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await apiService.checkTrendVideo(uri, plan, { kind, id });
    if (res.success && res.data) {
      setResult(res.data as CheckResult);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setError({ message: res.error || 'Impossible de vérifier ta vidéo.', code: res.code });
    }
    setLoading(false);
  }, [plan, kind, id]);

  useEffect(() => { run(videoUri); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const gate = useAnalysisGate(navigation);

  const retake = async () => {
    if (!(await gate())) return;
    const video = await pickVideo();
    if (!video) return;
    setVideoUri(video.uri);
    run(video.uri);
  };

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const done = result ? result.etapes.filter((e) => e.statut === 'ok').length : 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Vérifie ta</Text>
          <View style={styles.titleCapsule}><Text style={styles.titleCapsuleText}>version</Text></View>
        </View>
        <Text style={styles.subtitle} numberOfLines={2}>Comparée au plan « {plan?.titre ?? title} »</Text>

        {/* Vidéo + score */}
        <View style={styles.topRow}>
          <View style={styles.videoBox}>
            <ExpoVideo
              source={{ uri: videoUri }}
              style={StyleSheet.absoluteFillObject}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              isLooping
            />
          </View>
          <View style={styles.scoreBox}>
            {loading ? (
              <Animated.View style={{ transform: [{ scale }] }}>
                <LinearGradient colors={['#FF4FF9', '#9013FE']} style={styles.loadingOrb}>
                  <ScanSearch size={30} color="#FFF" />
                </LinearGradient>
              </Animated.View>
            ) : result ? (
              <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ alignItems: 'center' }}>
                <View style={[styles.scoreRing, { borderColor: scoreColor(result.score) }]}>
                  <Text style={[styles.scoreValue, { color: scoreColor(result.score) }]}>{result.score}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
                <View style={[styles.readyBadge, { backgroundColor: result.pret_a_publier ? 'rgba(66,255,176,0.15)' : 'rgba(255,216,79,0.15)' }]}>
                  <Text style={[styles.readyText, { color: result.pret_a_publier ? GREEN : YELLOW }]}>
                    {result.pret_a_publier ? 'Prête à publier ✓' : `${result.corrections.length || 1} correction${result.corrections.length > 1 ? 's' : ''} à faire`}
                  </Text>
                </View>
                <Text style={styles.stepsDone}>{done}/{result.etapes.length} étapes du plan</Text>
              </MotiView>
            ) : (
              <XCircle size={40} color={RED} />
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <MotiView key={step} from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}>
              <Text style={styles.loadingText}>{STEPS[step]}</Text>
            </MotiView>
            <Text style={styles.loadingHint}>Environ 30 secondes, ne quitte pas l’écran</Text>
          </View>
        ) : error ? (
          error.code === 'FREE_LIMIT_REACHED' ? (
            <View style={styles.errorCard}>
              <View style={styles.lockCircle}><Lock size={24} color="#FFF" /></View>
              <Text style={styles.errorTitle}>Analyses gratuites du jour utilisées</Text>
              <Text style={styles.errorText}>{error.message}</Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Paywall')} style={{ alignSelf: 'stretch', marginTop: 18 }}>
                <LinearGradient colors={['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                  <Sparkles size={18} color="#FFF" />
                  <Text style={styles.ctaText}>Passer à Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Oups</Text>
              <Text style={styles.errorText}>{error.message}</Text>
              <TouchableOpacity onPress={() => run(videoUri)} style={styles.retry}>
                <RefreshCw size={16} color="#FFF" />
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )
        ) : result ? (
          <>
            {/* Verdict */}
            <MotiView from={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <LinearGradient colors={['rgba(255,79,249,0.22)', 'rgba(144,19,254,0.22)']} style={styles.hero}>
                <Text style={styles.heroText}>{result.verdict}</Text>
              </LinearGradient>
            </MotiView>

            {/* Corrections en premier : c'est ce qu'il doit faire */}
            {result.corrections.length > 0 ? (
              <Card icon={<Wrench size={18} color={PINK} />} title="À corriger avant de publier" delay={60} accent="rgba(255, 79, 249, 0.5)">
                {result.corrections.map((c, i) => (
                  <View key={i} style={[styles.fix, i > 0 && styles.fixBorder]}>
                    <View style={styles.fixHead}>
                      <Text style={styles.fixNum}>{i + 1}</Text>
                      {c.moment ? <View style={styles.timeChip}><Text style={styles.timeText}>{c.moment}</Text></View> : null}
                    </View>
                    <Text style={styles.fixProblem}>{c.probleme}</Text>
                    <Text style={styles.fixSolution}>→ {c.solution}</Text>
                  </View>
                ))}
              </Card>
            ) : null}

            {/* Accroche */}
            <Card
              icon={<Zap size={18} color={result.accroche.statut === 'ok' ? GREEN : YELLOW} />}
              title={result.accroche.statut === 'ok' ? 'Accroche : validée' : 'Accroche : à renforcer'}
              delay={120}
            >
              <Text style={styles.body}>{result.accroche.constat}</Text>
              <Text style={styles.hint}>{result.accroche.conseil}</Text>
            </Card>

            {/* Étapes du plan */}
            <Card icon={<Film size={18} color="#4FC3FF" />} title="Le plan, étape par étape" delay={180}>
              {result.etapes.map((e, i) => {
                const s = STEP_STATUS[e.statut];
                return (
                  <View key={i} style={styles.stepRow}>
                    <s.Icon size={20} color={s.color} style={{ marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.stepHead}>
                        <Text style={styles.stepMoment}>{e.moment}</Text>
                        <Text style={[styles.stepStatus, { color: s.color }]}>{s.label}</Text>
                      </View>
                      <Text style={styles.stepExpected}>{e.attendu}</Text>
                      {e.commentaire ? <Text style={styles.hint}>{e.commentaire}</Text> : null}
                    </View>
                  </View>
                );
              })}
            </Card>

            {result.points_forts.length > 0 ? (
              <Card icon={<Star size={18} color={YELLOW} />} title="Ce qui marche déjà" delay={240}>
                {result.points_forts.map((p, i) => <Text key={i} style={styles.bullet}>• {p}</Text>)}
              </Card>
            ) : null}

            {result.touche_perso ? (
              <Card icon={<Sparkles size={18} color={VIOLET} />} title="Ta touche perso" delay={300}>
                <Text style={styles.body}>{result.touche_perso}</Text>
              </Card>
            ) : null}

            {/* Actions */}
            <TouchableOpacity activeOpacity={0.9} onPress={retake} style={{ marginTop: 10 }}>
              <LinearGradient colors={['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                <RefreshCw size={18} color="#FFF" />
                <Text style={styles.ctaText}>J’ai corrigé : revérifier</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('VideoAnalyzing', { videoUri })}
              style={styles.secondary}
            >
              <BarChart3 size={16} color="#FFF" />
              <Text style={styles.secondaryText}>Analyse complète (score viral, horaires…)</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0214' },
  content: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 80 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CARD_BORDER },

  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, flexWrap: 'wrap' },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  titleCapsule: { backgroundColor: PINK, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  titleCapsuleText: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#A1A1AA', marginTop: 8 },

  topRow: { flexDirection: 'row', gap: 16, marginTop: 20, marginBottom: 18 },
  videoBox: { width: 128, height: 228, borderRadius: 20, overflow: 'hidden', backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  scoreBox: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, padding: 12 },
  loadingOrb: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  scoreRing: { width: 104, height: 104, borderRadius: 52, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontSize: 36, fontWeight: '800' },
  scoreMax: { fontSize: 12, color: '#A1A1AA', marginTop: -4 },
  readyBadge: { marginTop: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  readyText: { fontSize: 12, fontWeight: '800' },
  stepsDone: { marginTop: 8, fontSize: 12, color: '#D9C8F5', fontWeight: '600' },

  loading: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  loadingText: { color: '#FFF', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  loadingHint: { color: '#A1A1AA', fontSize: 13, textAlign: 'center' },

  errorCard: { alignItems: 'center', padding: 24, borderRadius: 24, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  lockCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(144, 19, 254, 0.75)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  errorTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  errorText: { color: '#A1A1AA', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(144, 19, 254, 0.5)' },
  retryText: { color: '#FFF', fontWeight: '700' },

  hero: { padding: 18, borderRadius: 22, borderWidth: 1.4, borderColor: 'rgba(255, 79, 249, 0.45)', marginBottom: 14 },
  heroText: { color: '#FFF', fontSize: 16, fontWeight: '700', lineHeight: 23 },

  card: { padding: 18, borderRadius: 22, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', flex: 1 },
  body: { color: '#EAEAEA', fontSize: 14, lineHeight: 21 },
  hint: { color: '#A1A1AA', fontSize: 13, lineHeight: 19, marginTop: 6 },
  bullet: { color: '#EAEAEA', fontSize: 14, lineHeight: 21, marginBottom: 4 },

  fix: { paddingVertical: 10 },
  fixBorder: { borderTopWidth: 1, borderTopColor: 'rgba(179, 113, 255, 0.2)' },
  fixHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  fixNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255, 79, 249, 0.35)', color: '#FFF', fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 22, overflow: 'hidden' },
  timeChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(79, 195, 255, 0.2)' },
  timeText: { color: '#4FC3FF', fontSize: 12, fontWeight: '800' },
  fixProblem: { color: '#FFF', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  fixSolution: { color: '#D9C8F5', fontSize: 14, lineHeight: 20, marginTop: 4 },

  stepRow: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  stepHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepMoment: { color: '#4FC3FF', fontSize: 12, fontWeight: '800' },
  stepStatus: { fontSize: 12, fontWeight: '800' },
  stepExpected: { color: '#FFF', fontSize: 14, fontWeight: '600', marginTop: 2, lineHeight: 20 },

  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 999 },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  secondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 14, borderRadius: 999, borderWidth: 1, borderColor: CARD_BORDER },
  secondaryText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});

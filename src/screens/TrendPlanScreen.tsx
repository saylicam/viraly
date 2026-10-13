import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Linking, Alert, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  ChevronLeft, Wand2, Sparkles, Zap, Clapperboard, Music2, Copy, CalendarPlus, Clock, Lightbulb,
  Timer, Play, RefreshCw, Lock, ScanSearch,
} from 'lucide-react-native';
import { pickVideo } from '../utils/pickVideo';
import { apiService, resolveApiUrl } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { saveTask } from '../services/calendarService';
import { useAnalysisGate } from '../hooks/useAnalysisGate';

interface RemixPlan {
  titre: string;
  concept: string;
  pourquoi_ca_marche: string;
  accroche: { texte_ecran: string; phrase: string; conseil: string };
  plans: { moment: string; action: string; texte_ecran?: string }[];
  son: { titre: string; conseil: string };
  legende: string;
  hashtags: string[];
  meilleur_moment: string;
  duree_conseillee: string;
  astuce_pro: string;
}

interface Params {
  kind: 'sound' | 'video';
  id: string;
  title: string;
  subtitle?: string | null;
  cover?: string | null;
  url?: string;
  stage?: 'emerging' | 'peak' | 'declining';
  niche?: string;
  level?: string;
}

const PINK = '#FF4FF9';
const VIOLET = '#B371FF';
const CARD_BG = '#1B0730';
const CARD_BORDER = 'rgba(179, 113, 255, 0.35)';

const LOADING_STEPS = [
  'On décortique la tendance…',
  'On l’adapte à ta niche…',
  'On écrit ton accroche…',
  'On prépare ton plan de tournage…',
];

const tag = (t: string) => `#${t.replace(/^#+/, '').replace(/\s+/g, '')}`;

const localDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Quand tourner / publier selon la fenêtre de tir. */
const scheduleFor = (stage?: Params['stage']) =>
  stage === 'peak'
    ? { record: 0, publish: 1, label: 'Tendance au sommet : tourne aujourd’hui, publie demain.' }
    : { record: 1, publish: 2, label: stage === 'emerging' ? 'Tendance émergente : tu as un peu d’avance, profites-en.' : 'Tourne demain, publie après-demain.' };

const Card = ({ icon, title, children, delay = 0 }: { icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number }) => (
  <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay }} style={styles.card}>
    <View style={styles.cardHeader}>
      {icon}
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </MotiView>
);

export default function TrendPlanScreen({ route, navigation }: any) {
  const params: Params = route.params;
  const { user } = useAuth();
  const [plan, setPlan] = useState<RemixPlan | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [planned, setPlanned] = useState(false);
  const [saving, setSaving] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }));
    anim.start();
    return () => anim.stop();
  }, [spin]);

  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 2200);
    return () => clearInterval(t);
  }, [loading]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiService.remixTrend({ kind: params.kind, id: params.id, niche: params.niche, level: params.level });
    if (res.success && res.data) {
      setPlan(res.data as RemixPlan);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setError({ message: res.error || 'Impossible de générer le plan.', code: res.code });
    }
    setLoading(false);
  }, [params.kind, params.id, params.niche, params.level]);

  useEffect(() => { load(); }, [load]);

  const copy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(label, 'Colle-le directement dans TikTok.');
  };

  const planIt = async () => {
    if (!plan || saving) return;
    setSaving(true);
    const when = scheduleFor(params.stage);
    const hashtags = plan.hashtags.map(tag).join(' ');
    const shots = plan.plans.map((p) => `• ${p.moment} : ${p.action}`).join('\n');
    const notes = `Accroche : « ${plan.accroche.phrase} »\n${shots}\nSon : ${plan.son.titre}`;
    try {
      const uid = user?.uid || null;
      await saveTask({ date: localDate(when.record), hour: '18:00', type: 'record', title: `Tourner : ${plan.titre}`, createdBy: 'ai', notes }, uid);
      await saveTask({ date: localDate(when.publish), hour: '19:00', type: 'publish', title: `Publier : ${plan.titre}`, createdBy: 'ai', notes: `${plan.legende}\n${hashtags}` }, uid);
      setPlanned(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('C’est planifié 📅', `${when.label}\nRetrouve les étapes dans ton calendrier.`, [
        { text: 'OK' },
        { text: 'Voir le calendrier', onPress: () => navigation.navigate('Main', { screen: 'Calendar' }) },
      ]);
    } catch {
      Alert.alert('Oups', 'Impossible d’ajouter au calendrier pour le moment.');
    } finally {
      setSaving(false);
    }
  };

  const checkMyVersion = async () => {
    if (!plan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!(await gate())) return;
    const video = await pickVideo();
    if (!video) return;
    navigation.navigate('TrendCheck', { videoUri: video.uri, plan, kind: params.kind, id: params.id, title: params.title });
  };

  const cover = resolveApiUrl(params.cover ?? null);
  const gate = useAnalysisGate(navigation);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft size={26} color="#FFF" />
        </TouchableOpacity>

        {/* En-tête : la tendance d'origine */}
        <TouchableOpacity activeOpacity={0.85} disabled={!params.url} onPress={() => params.url && Linking.openURL(params.url)} style={styles.source}>
          {cover ? <Image source={{ uri: cover }} style={styles.sourceCover} /> : (
            <LinearGradient colors={['#7B33F7', '#FF4FF9']} style={[styles.sourceCover, { alignItems: 'center', justifyContent: 'center' }]}>
              {params.kind === 'sound' ? <Music2 size={22} color="#FFF" /> : <Play size={22} color="#FFF" />}
            </LinearGradient>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceLabel}>{params.kind === 'sound' ? 'Son tendance' : 'Vidéo tendance'}</Text>
            <Text style={styles.sourceTitle} numberOfLines={1}>{params.title}</Text>
            {params.subtitle ? <Text style={styles.sourceSub} numberOfLines={1}>{params.subtitle}</Text> : null}
          </View>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Refais-la</Text>
          <View style={styles.titleCapsule}><Text style={styles.titleCapsuleText}>à ta façon</Text></View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <LinearGradient colors={['#FF4FF9', '#9013FE']} style={styles.loadingOrb}>
                <Wand2 size={30} color="#FFF" />
              </LinearGradient>
            </Animated.View>
            <MotiView key={step} from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }}>
              <Text style={styles.loadingText}>{LOADING_STEPS[step]}</Text>
            </MotiView>
            <Text style={styles.loadingHint}>Environ 10 secondes</Text>
          </View>
        ) : error ? (
          error.code === 'FREE_LIMIT_REACHED' ? (
            <View style={styles.errorCard}>
              <View style={styles.lockCircle}><Lock size={24} color="#FFF" /></View>
              <Text style={styles.errorTitle}>Ton plan gratuit du jour est utilisé</Text>
              <Text style={styles.errorText}>Avec Premium, transforme toutes les tendances en plans de tournage, sans limite.</Text>
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
              <TouchableOpacity onPress={load} style={styles.retry}>
                <RefreshCw size={16} color="#FFF" />
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )
        ) : plan ? (
          <>
            {/* Concept */}
            <MotiView from={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
              <LinearGradient colors={['rgba(255,79,249,0.22)', 'rgba(144,19,254,0.22)']} style={styles.hero}>
                <Text style={styles.heroTitle}>{plan.titre}</Text>
                <Text style={styles.heroConcept}>{plan.concept}</Text>
                <View style={styles.pills}>
                  <View style={styles.pill}><Timer size={13} color="#FFF" /><Text style={styles.pillText}>{plan.duree_conseillee}</Text></View>
                  <View style={styles.pill}><Clock size={13} color="#FFF" /><Text style={styles.pillText}>{plan.meilleur_moment}</Text></View>
                </View>
              </LinearGradient>
            </MotiView>

            <Card icon={<Sparkles size={18} color="#FFD84F" />} title="Pourquoi ça marche" delay={60}>
              <Text style={styles.body}>{plan.pourquoi_ca_marche}</Text>
            </Card>

            {/* Accroche */}
            <Card icon={<Zap size={18} color={PINK} />} title="Ton accroche (3 premières secondes)" delay={120}>
              <View style={styles.screenText}>
                <Text style={styles.screenTextLabel}>Texte à l’écran</Text>
                <Text style={styles.screenTextValue}>{plan.accroche.texte_ecran}</Text>
              </View>
              <Text style={styles.quote}>« {plan.accroche.phrase} »</Text>
              <Text style={styles.hint}>{plan.accroche.conseil}</Text>
            </Card>

            {/* Plans */}
            <Card icon={<Clapperboard size={18} color="#4FC3FF" />} title="Plan de tournage" delay={180}>
              {plan.plans.map((p, i) => (
                <View key={i} style={styles.shot}>
                  <View style={styles.shotLeft}>
                    <View style={styles.shotDot}><Text style={styles.shotNum}>{i + 1}</Text></View>
                    {i < plan.plans.length - 1 ? <View style={styles.shotLine} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 14 }}>
                    <Text style={styles.shotMoment}>{p.moment}</Text>
                    <Text style={styles.body}>{p.action}</Text>
                    {p.texte_ecran ? <Text style={styles.shotText}>📝 {p.texte_ecran}</Text> : null}
                  </View>
                </View>
              ))}
            </Card>

            {/* Son */}
            <Card icon={<Music2 size={18} color={VIOLET} />} title="Le son" delay={240}>
              <Text style={styles.soundTitle}>{plan.son.titre}</Text>
              <Text style={styles.hint}>{plan.son.conseil}</Text>
            </Card>

            {/* Légende + hashtags */}
            <Card icon={<Copy size={18} color="#42FFB0" />} title="Légende et hashtags" delay={300}>
              <Text style={styles.body}>{plan.legende}</Text>
              <View style={styles.tags}>
                {plan.hashtags.map((h) => (
                  <TouchableOpacity key={h} onPress={() => copy(tag(h), 'Hashtag copié')} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag(h)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity activeOpacity={0.9} onPress={() => copy(`${plan.legende}\n\n${plan.hashtags.map(tag).join(' ')}`, 'Légende copiée')} style={styles.copyBtn}>
                <Copy size={15} color="#FFF" />
                <Text style={styles.copyText}>Copier la légende + hashtags</Text>
              </TouchableOpacity>
            </Card>

            <Card icon={<Lightbulb size={18} color="#FFD84F" />} title="L’astuce pro" delay={360}>
              <Text style={styles.body}>{plan.astuce_pro}</Text>
            </Card>

            {/* Planifier */}
            <TouchableOpacity activeOpacity={0.9} onPress={planIt} disabled={planned || saving} style={{ marginTop: 10 }}>
              <LinearGradient colors={planned ? ['#2A0F45', '#2A0F45'] : ['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                <CalendarPlus size={18} color="#FFF" />
                <Text style={styles.ctaText}>{planned ? 'Ajouté à ton calendrier ✓' : saving ? 'Ajout…' : 'Planifier cette tendance'}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.ctaHint}>{scheduleFor(params.stage).label}</Text>

            {/* Étape suivante : vérifier la vidéo tournée */}
            <TouchableOpacity activeOpacity={0.9} onPress={checkMyVersion} style={styles.checkCard}>
              <View style={styles.checkIcon}><ScanSearch size={22} color="#FFF" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>Tu as tourné ? Vérifie ta version</Text>
                <Text style={styles.checkText}>L’IA compare ta vidéo à ce plan et te dit quoi corriger avant de publier.</Text>
              </View>
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

  source: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, padding: 12, borderRadius: 20, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  sourceCover: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#2A0F45' },
  sourceLabel: { color: PINK, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  sourceTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', marginTop: 2 },
  sourceSub: { color: '#A1A1AA', fontSize: 13, marginTop: 1 },

  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 18, flexWrap: 'wrap' },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  titleCapsule: { backgroundColor: PINK, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  titleCapsuleText: { fontSize: 26, fontWeight: '800', color: '#FFF' },

  loading: { alignItems: 'center', paddingVertical: 60, gap: 18 },
  loadingOrb: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#FFF', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  loadingHint: { color: '#A1A1AA', fontSize: 13 },

  errorCard: { alignItems: 'center', padding: 24, borderRadius: 24, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  lockCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(144, 19, 254, 0.75)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  errorTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  errorText: { color: '#A1A1AA', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(144, 19, 254, 0.5)' },
  retryText: { color: '#FFF', fontWeight: '700' },

  hero: { padding: 20, borderRadius: 24, borderWidth: 1.4, borderColor: 'rgba(255, 79, 249, 0.45)', marginBottom: 14 },
  heroTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', lineHeight: 28 },
  heroConcept: { color: '#EAEAEA', fontSize: 15, lineHeight: 22, marginTop: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(10,2,20,0.45)' },
  pillText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  card: { padding: 18, borderRadius: 22, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', flex: 1 },
  body: { color: '#EAEAEA', fontSize: 14, lineHeight: 21 },
  hint: { color: '#A1A1AA', fontSize: 13, lineHeight: 19, marginTop: 8 },

  screenText: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(255, 79, 249, 0.12)', borderWidth: 1, borderColor: 'rgba(255, 79, 249, 0.35)' },
  screenTextLabel: { color: PINK, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  screenTextValue: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 4 },
  quote: { color: '#FFF', fontSize: 15, fontStyle: 'italic', marginTop: 12, lineHeight: 22 },

  shot: { flexDirection: 'row', gap: 12 },
  shotLeft: { alignItems: 'center', width: 26 },
  shotDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(79, 195, 255, 0.25)', alignItems: 'center', justifyContent: 'center' },
  shotNum: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  shotLine: { flex: 1, width: 2, backgroundColor: 'rgba(79, 195, 255, 0.25)', marginVertical: 4 },
  shotMoment: { color: '#4FC3FF', fontSize: 12, fontWeight: '800', marginBottom: 3 },
  shotText: { color: '#D9C8F5', fontSize: 13, marginTop: 6 },

  soundTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(66, 255, 176, 0.12)', borderWidth: 1, borderColor: 'rgba(66, 255, 176, 0.35)' },
  tagText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(66, 255, 176, 0.18)' },
  copyText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 999 },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  checkCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22, padding: 16, borderRadius: 22, backgroundColor: 'rgba(79, 195, 255, 0.12)', borderWidth: 1.4, borderColor: 'rgba(79, 195, 255, 0.45)' },
  checkIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(79, 195, 255, 0.35)', alignItems: 'center', justifyContent: 'center' },
  checkTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  checkText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18, marginTop: 3 },
  ctaHint: { color: '#A1A1AA', fontSize: 13, textAlign: 'center', marginTop: 10 },
});

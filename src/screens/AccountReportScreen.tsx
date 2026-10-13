import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Easing, Linking, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Defs, LinearGradient as SvgGradient, Stop, Line, Rect } from 'react-native-svg';
import {
  ChevronLeft, RefreshCw, Sparkles, Lock, Eye, Heart, Calendar, Clock, Play, Trophy, TrendingUp, TrendingDown,
  Target, Flame, Users, Mic, Palette, CheckCircle2, AlertTriangle, Lightbulb, Zap, Ban, ExternalLink, Fingerprint, Crown,
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useRevenueCat } from '../context/RevenueCatContext';
import { useCreatorProfile, normalizeTikTok, saveCreatorProfile } from '../services/creatorProfile';
import { useAccountAudit, runAccountAudit, progressSince, type AccountAudit, type AccountVideo } from '../services/accountAudit';
import { apiService } from '../services/api';
import { formatCount, formatDelta } from '../utils/format';

// ---------- Style ----------

const BG = '#0A0214';
const PINK = '#FF4FF9';
const VIOLET = '#9B4DFF';
const CARD = '#140724';
const BORDER = 'rgba(179,113,255,0.22)';
const MUTED = '#B9A6D9';
const FAINT = '#7E6A9E';
const GREEN = '#42FFB0';
const BLUE = '#4FC3FF';
const YELLOW = '#FFD84F';
const RED = '#FF6B8A';
const PART_COLORS: Record<string, string> = { engagement: PINK, regularite: BLUE, portee: GREEN, dynamique: YELLOW };
const scoreColor = (s: number) => (s >= 75 ? GREEN : s >= 60 ? BLUE : s >= 45 ? YELLOW : RED);
const scoreWord = (s: number) => (s >= 80 ? 'Excellent' : s >= 65 ? 'Très bon' : s >= 50 ? 'Bon début' : s >= 35 ? 'À booster' : 'Tout à construire');

const frDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  } catch {
    return iso.slice(0, 10);
  }
};

// ---------- Petits composants ----------

/** Chiffre qui défile jusqu'à sa valeur. */
const CountUp = ({ value, style, delay = 0, format = formatCount, suffix = '' }: { value: number; style?: any; delay?: number; format?: (n: number) => string; suffix?: string }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(v));
    Animated.timing(anim, { toValue: value, duration: 1300, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Text style={style}>{format(Number.isInteger(value) ? Math.round(shown) : Math.round(shown * 10) / 10)}{suffix}</Text>;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ScoreRing = ({ value, size = 150 }: { value: number; size?: number }) => {
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, { toValue: value / 100, duration: 1500, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const offset = fill.interpolate({ inputRange: [0, 1], outputRange: [c, 0] });
  const col = scoreColor(value);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={PINK} />
            <Stop offset="1" stopColor={col} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke="url(#ring)" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${c}`} strokeDashoffset={offset as any} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <CountUp value={value} delay={250} style={styles.ringValue} format={(n) => String(Math.round(n))} />
      <Text style={styles.ringMax}>/100</Text>
    </View>
  );
};

const Bar = ({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) => (
  <View style={styles.barTrack}>
    <MotiView from={{ width: '0%' }} animate={{ width: `${Math.max(4, Math.min(100, value))}%` }} transition={{ type: 'timing', duration: 1100, delay }} style={[styles.barFill, { backgroundColor: color }]} />
  </View>
);

const Section = ({ title, Icon, color = PINK, right, children, delay = 0 }: { title: string; Icon: any; color?: string; right?: React.ReactNode; children: React.ReactNode; delay?: number }) => (
  <MotiView from={{ opacity: 0, translateY: 18 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 480, delay }} style={{ marginTop: 26 }}>
    <View style={styles.sectionHead}>
      <View style={[styles.sectionIcon, { backgroundColor: `${color}22` }]}><Icon size={16} color={color} /></View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
    {children}
  </MotiView>
);

/** Contenu réservé à Premium : on montre ce qui est caché pour donner envie. */
const Locked = ({ lines, label, onUnlock }: { lines: string[]; label: string; onUnlock: () => void }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onUnlock} style={styles.locked}>
    {lines.slice(0, 4).map((l, i) => (
      <View key={`${l}-${i}`} style={styles.lockedRow}>
        <View style={styles.lockedDot} />
        <Text style={styles.lockedTitle} numberOfLines={1}>{l}</Text>
        <View style={[styles.lockedBlur, { width: 70 + ((i * 37) % 60) }]} />
      </View>
    ))}
    <LinearGradient colors={['rgba(10,2,20,0)', 'rgba(10,2,20,0.92)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
    <View style={styles.lockedCta}>
      <LinearGradient colors={[PINK, '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.lockedBtn}>
        <Lock size={15} color="#FFF" />
        <Text style={styles.lockedBtnText}>{label}</Text>
      </LinearGradient>
    </View>
  </TouchableOpacity>
);

/** Courbe des vues des dernières vidéos. */
const ViewsChart = ({ series, median, width }: { series: { id: string; views: number }[]; median: number; width: number }) => {
  const h = 150;
  const pad = 10;
  if (series.length < 3) return null;
  const max = Math.max(...series.map((s) => s.views), median) * 1.12 || 1;
  const step = (width - pad * 2) / (series.length - 1);
  const pts = series.map((s, i) => ({ x: pad + i * step, y: h - pad - (s.views / max) * (h - pad * 2), v: s.views }));
  const line = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`;
  const best = pts.reduce((a, b) => (b.v > a.v ? b : a), pts[0]);
  const medY = h - pad - (median / max) * (h - pad * 2);
  return (
    <Svg width={width} height={h}>
      <Defs>
        <SvgGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={PINK} stopOpacity="0.45" />
          <Stop offset="1" stopColor={PINK} stopOpacity="0" />
        </SvgGradient>
        <SvgGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={VIOLET} />
          <Stop offset="1" stopColor={PINK} />
        </SvgGradient>
      </Defs>
      <Path d={area} fill="url(#area)" />
      <Line x1={pad} x2={width - pad} y1={medY} y2={medY} stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeDasharray="4 5" />
      <Path d={line} stroke="url(#stroke)" strokeWidth={3} fill="none" strokeLinecap="round" />
      <Circle cx={best.x} cy={best.y} r={9} fill="rgba(255,216,79,0.25)" />
      <Circle cx={best.x} cy={best.y} r={5} fill={YELLOW} />
    </Svg>
  );
};

const WeekBars = ({ data }: { data: { day: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const bestIdx = data.reduce((bi, d, i) => (d.value > data[bi].value ? i : bi), 0);
  return (
    <View style={styles.week}>
      {data.map((d, i) => {
        const best = i === bestIdx && d.value > 0;
        return (
          <View key={d.day} style={styles.weekCol}>
            <Text style={[styles.weekVal, best && { color: YELLOW }]}>{d.value ? formatCount(d.value) : ''}</Text>
            <View style={styles.weekTrack}>
              <MotiView from={{ height: '0%' }} animate={{ height: `${d.value ? Math.max(8, (d.value / max) * 100) : 3}%` }} transition={{ type: 'timing', duration: 900, delay: 100 + i * 70 }} style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }}>
                <LinearGradient colors={best ? [YELLOW, '#FF9F4F'] : d.value ? [PINK, VIOLET] : ['#2A1A40', '#2A1A40']} style={{ flex: 1 }} />
              </MotiView>
            </View>
            <Text style={[styles.weekDay, best && { color: '#FFF' }]}>{d.day}</Text>
          </View>
        );
      })}
    </View>
  );
};

const VideoCard = ({ v, rank, onPress }: { v: AccountVideo; rank: number; onPress: () => void }) => {
  const [broken, setBroken] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.vCard}>
      {v.cover && !broken ? (
        <Image source={{ uri: v.cover }} style={StyleSheet.absoluteFill} onError={() => setBroken(true)} />
      ) : (
        <LinearGradient colors={['#3A1468', '#160628']} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
      <View style={[styles.vRank, rank === 1 && { backgroundColor: YELLOW }]}>
        {rank === 1 ? <Crown size={13} color="#2A1A00" /> : <Text style={styles.vRankText}>{rank}</Text>}
      </View>
      <View style={styles.vBottom}>
        <View style={styles.vViews}><Play size={12} color="#FFF" fill="#FFF" /><Text style={styles.vViewsText}>{formatCount(v.views)}</Text></View>
        <Text style={styles.vDesc} numberOfLines={2}>{v.description || 'Sans légende'}</Text>
        <Text style={styles.vEng}>{String(v.engagement).replace('.', ',')} % d’engagement</Text>
      </View>
    </TouchableOpacity>
  );
};

// ---------- États d'attente ----------

const SCAN_STEPS = [
  'Lecture de tes dernières vidéos',
  'Calcul de tes vues et de ton engagement',
  'Recherche de tes meilleurs jours et horaires',
  'L’IA cherche ce qui marche chez toi',
  'Écriture de ton plan de la semaine',
];

const Scanning = ({ avatar, handle }: { avatar?: string | null; handle: string }) => {
  const [step, setStep] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(SCAN_STEPS.length - 1, s + 1)), 3800);
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => { clearInterval(t); loop.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.scan}>
      <View style={styles.radar}>
        {[0, 1, 2].map((i) => (
          <MotiView key={i} from={{ scale: 0.6, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ type: 'timing', duration: 2400, delay: i * 800, loop: true, repeatReverse: false }} style={styles.radarWave} />
        ))}
        <Animated.View style={[styles.radarSpin, { transform: [{ rotate }] }]}>
          <LinearGradient colors={[PINK, 'rgba(255,79,249,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1, borderRadius: 80 }} />
        </Animated.View>
        <View style={styles.radarCore}>
          {avatar ? <Image source={{ uri: avatar }} style={styles.radarAvatar} /> : <Text style={styles.radarAt}>@</Text>}
        </View>
      </View>
      <Text style={styles.scanTitle}>L’IA étudie @{handle}</Text>
      <View style={{ marginTop: 22, gap: 12, alignSelf: 'stretch' }}>
        {SCAN_STEPS.map((s, i) => (
          <View key={s} style={[styles.scanRow, { opacity: i <= step ? 1 : 0.35 }]}>
            {i < step ? <CheckCircle2 size={18} color={GREEN} /> : i === step ? <ActivityIndicator size="small" color={PINK} /> : <View style={styles.scanDot} />}
            <Text style={[styles.scanText, i === step && { color: '#FFF' }]}>{s}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.scanHint}>Environ 20 secondes</Text>
    </View>
  );
};

/** Pas encore de @ : formulaire pour relier son compte. */
const LinkAccount = ({ onLinked }: { onLinked: (handle: string, preview: any) => void }) => {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    Keyboard.dismiss();
    const h = normalizeTikTok(value);
    if (!h) { setErr('Écris ton pseudo TikTok, par exemple @ilyas.creates'); return; }
    setBusy(true);
    setErr(null);
    const res = await apiService.previewTikTok(h);
    setBusy(false);
    if (res.success && res.data) onLinked(h, res.data);
    else if (res.code === 'NOT_FOUND' || res.code === 'INVALID_HANDLE') setErr(res.error ?? 'Compte introuvable.');
    else onLinked(h, null);
  };
  return (
    <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} style={{ paddingTop: 10 }}>
      <LinearGradient colors={['rgba(255,79,249,0.2)', 'rgba(123,31,224,0.12)']} style={styles.linkCard}>
        <View style={styles.linkIcon}><Fingerprint size={30} color="#FFF" /></View>
        <Text style={styles.linkTitle}>Relie ton compte TikTok</Text>
        <Text style={styles.linkText}>L’IA étudie tes vraies vidéos : ce qui marche, tes meilleurs horaires, ton score de créateur et un plan pour la semaine. Ensuite, toutes tes analyses deviennent personnelles.</Text>
        <View style={[styles.linkInput, err && { borderColor: RED }]}>
          <Text style={styles.linkAt}>@</Text>
          <TextInput value={value.replace(/^@+/, '')} onChangeText={(t) => { setValue(t); setErr(null); }} placeholder="ton.pseudo" placeholderTextColor={FAINT}
            autoCapitalize="none" autoCorrect={false} style={styles.linkField} returnKeyType="search" onSubmitEditing={submit} />
        </View>
        {err ? <Text style={styles.linkErr}>{err}</Text> : null}
        <TouchableOpacity activeOpacity={0.9} onPress={submit} disabled={busy} style={{ alignSelf: 'stretch', marginTop: 14 }}>
          <LinearGradient colors={[PINK, '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
            {busy ? <ActivityIndicator color="#FFF" /> : <><Sparkles size={18} color="#FFF" /><Text style={styles.ctaText}>Lancer mon bilan</Text></>}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.linkSafe}>🔒 Aucun mot de passe : on lit seulement ton profil public.</Text>
      </LinearGradient>
    </MotiView>
  );
};

// ---------- Écran ----------

export default function AccountReportScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { isPremium } = useRevenueCat();
  const { profile, loading: profileLoading } = useCreatorProfile();
  const handle = profile?.tiktok ?? null;
  const { audit, history } = useAccountAudit(handle);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const started = useRef(false);
  const uid = user?.uid ?? null;

  const run = useCallback(async (refresh = false) => {
    if (!uid) return;
    setRunning(true);
    setError(null);
    const res = await runAccountAudit({ refresh, uid });
    setRunning(false);
    if (res.success) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else setError({ message: res.error, code: res.code });
  }, [uid]);

  // Premier bilan lancé tout seul dès qu'un @ est connu
  useEffect(() => {
    if (profileLoading || !handle || audit || started.current || !uid) return;
    started.current = true;
    run(false);
  }, [profileLoading, handle, audit, uid, run]);

  const onLinked = async (h: string, preview: any) => {
    started.current = false;
    await saveCreatorProfile({ tiktok: h, ...(preview ? { tiktokPreview: preview } : {}) }, uid);
  };

  const openPaywall = () => navigation.navigate('Paywall');
  const openVideo = (v?: AccountVideo) => v && Linking.openURL(v.url).catch(() => {});

  const a = audit as AccountAudit | null;
  const locked = !!a?.limited && !isPremium;
  const progress = progressSince(history);
  const byId = useMemo(() => new Map((a?.videos ?? []).concat(a?.topVideos ?? []).map((v) => [v.id, v])), [a]);
  const chartW = width - 40 - 32;

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ChevronLeft size={22} color="#FFF" /></TouchableOpacity>
      <Text style={styles.headerTitle}>Bilan de ton compte</Text>
      {a && !running ? (
        <TouchableOpacity onPress={() => (isPremium ? run(true) : openPaywall())} style={styles.iconBtn}>
          <RefreshCw size={18} color="#FFF" />
        </TouchableOpacity>
      ) : <View style={{ width: 38 }} />}
    </View>
  );

  // --- États sans bilan ---
  if (!uid) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <Fingerprint size={44} color={PINK} />
          <Text style={styles.emptyTitle}>Crée ton compte pour ton bilan</Text>
          <Text style={styles.emptyText}>Le bilan de ton compte TikTok est gardé dans ton compte Viraly et mis à jour chaque semaine.</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.goBack()} style={{ alignSelf: 'stretch', marginTop: 20 }}>
            <LinearGradient colors={[PINK, '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}><Text style={styles.ctaText}>Créer mon compte</Text></LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!handle) {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header}
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled"><LinkAccount onLinked={onLinked} /></ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (!a && (running || (!error && !started.current))) {
    return <View style={styles.root}>{header}<Scanning handle={handle} avatar={profile?.tiktokPreview?.avatar} /></View>;
  }

  if (!a) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <AlertTriangle size={40} color={YELLOW} />
          <Text style={styles.emptyTitle}>Bilan impossible pour le moment</Text>
          <Text style={styles.emptyText}>{error?.message}</Text>
          <TouchableOpacity activeOpacity={0.9} onPress={() => (error?.code === 'AUDIT_LIMIT' ? openPaywall() : run(false))} style={{ alignSelf: 'stretch', marginTop: 20 }}>
            <LinearGradient colors={[PINK, '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
              <Text style={styles.ctaText}>{error?.code === 'AUDIT_LIMIT' ? 'Passer à Premium' : 'Réessayer'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => saveCreatorProfile({ tiktok: '' }, uid)} style={{ marginTop: 16 }}>
            <Text style={styles.link}>Changer de compte TikTok</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { profile: p, stats: s, score, insights: ins } = a;
  const best = byId.get(ins.meilleure_video.id) ?? a.topVideos[0];
  const worst = byId.get(ins.video_a_retravailler.id);
  const engRatio = s.engagementBenchmark ? s.engagementRate / s.engagementBenchmark : 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* ---------- Héros ---------- */}
        <LinearGradient colors={['#3B0F6E', '#1A0633', BG]} style={{ paddingBottom: 8 }}>
          <View style={styles.aurora1} />
          <View style={styles.aurora2} />
          {header}
          <View style={styles.hero}>
            <MotiView from={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 12 }}>
              <LinearGradient colors={[PINK, VIOLET, BLUE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarRing}>
                {p.avatar ? <Image source={{ uri: p.avatar }} style={styles.avatar} /> : <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A1650' }]}><Text style={styles.avatarLetter}>{p.nickname.slice(0, 1)}</Text></View>}
              </LinearGradient>
            </MotiView>
            <Text style={styles.name} numberOfLines={1}>{p.nickname}{p.verified ? '  ✓' : ''}</Text>
            <Text style={styles.handle}>@{p.handle} · {ins.niveau}</Text>
            <View style={styles.heroStats}>
              {[
                { v: p.followers, l: 'abonnés' },
                { v: p.likes, l: 'j’aime' },
                { v: p.videoCount, l: 'vidéos' },
              ].map((x, i) => (
                <View key={x.l} style={[styles.heroStat, i === 1 && styles.heroStatMid]}>
                  <CountUp value={x.v} delay={200 + i * 150} style={styles.heroValue} />
                  <Text style={styles.heroLabel}>{x.l}</Text>
                </View>
              ))}
            </View>
            {progress && progress.followers !== 0 ? (
              <View style={[styles.deltaPill, progress.followers < 0 && { backgroundColor: 'rgba(255,107,138,0.15)' }]}>
                {progress.followers > 0 ? <TrendingUp size={14} color={GREEN} /> : <TrendingDown size={14} color={RED} />}
                <Text style={[styles.deltaText, progress.followers < 0 && { color: RED }]}>
                  {formatDelta(progress.followers)} abonnés depuis le {frDate(progress.since)}
                </Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ---------- Score ---------- */}
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 150 }} style={styles.scoreCard}>
            <View style={styles.scoreTop}>
              <ScoreRing value={score.total} size={132} />
              <View style={{ flex: 1, gap: 10 }}>
                <View>
                  <Text style={styles.scoreKicker}>SCORE VIRALY</Text>
                  <Text style={[styles.scoreWord, { color: scoreColor(score.total) }]}>{scoreWord(score.total)}</Text>
                </View>
                {score.parts.map((pt, i) => (
                  <View key={pt.key}>
                    <View style={styles.partRow}>
                      <Text style={styles.partLabel}>{pt.label}</Text>
                      <Text style={[styles.partValue, { color: PART_COLORS[pt.key] }]}>{pt.value}</Text>
                    </View>
                    <Bar value={pt.value} color={PART_COLORS[pt.key]} delay={350 + i * 120} />
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.verdict}>{ins.titre}</Text>
            <Text style={styles.resume}>{ins.resume}</Text>
          </MotiView>

          {/* ---------- ADN ---------- */}
          <Section title="Ton ADN de créateur" Icon={Fingerprint} color={VIOLET} delay={200}>
            <View style={styles.dnaGrid}>
              {[
                { Icon: Target, c: PINK, l: 'Ta vraie niche', v: ins.niche_detectee },
                { Icon: Palette, c: BLUE, l: 'Ton style', v: ins.style },
                { Icon: Mic, c: YELLOW, l: 'Ton ton', v: ins.ton },
                { Icon: Users, c: GREEN, l: 'Ton public', v: ins.public },
              ].filter((x) => x.v).map((x, i) => (
                <MotiView key={x.l} from={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 300 + i * 90 }} style={[styles.dna, i === 3 && { width: '100%' }]}>
                  <x.Icon size={16} color={x.c} />
                  <Text style={styles.dnaLabel}>{x.l}</Text>
                  <Text style={styles.dnaValue}>{x.v}</Text>
                </MotiView>
              ))}
            </View>
            <View style={styles.aiNote}>
              <Sparkles size={14} color={PINK} />
              <Text style={styles.aiNoteText}>L’IA se sert de ce profil pour toutes tes analyses vidéo et tes plans de tendance.</Text>
            </View>
          </Section>

          {/* ---------- Chiffres ---------- */}
          <Section title="Tes chiffres clés" Icon={Zap} color={YELLOW}>
            <View style={styles.kpis}>
              <View style={styles.kpi}>
                <Eye size={16} color={PINK} />
                <CountUp value={s.medianViews} style={styles.kpiValue} />
                <Text style={styles.kpiLabel}>vues par vidéo</Text>
                <Text style={styles.kpiSub}>{s.viewsPerFollower >= 1 ? 'Plus que tes abonnés 🔥' : `${Math.round(s.viewsPerFollower * 100)} % de tes abonnés`}</Text>
              </View>
              <View style={styles.kpi}>
                <Heart size={16} color={RED} />
                <CountUp value={s.engagementRate} style={styles.kpiValue} format={(n) => String(n).replace('.', ',')} suffix=" %" />
                <Text style={styles.kpiLabel}>d’engagement</Text>
                <Text style={[styles.kpiSub, { color: engRatio >= 1 ? GREEN : engRatio >= 0.7 ? YELLOW : RED }]}>
                  {engRatio >= 1.2 ? 'Bien au-dessus de la moyenne' : engRatio >= 1 ? 'Au-dessus de la moyenne' : engRatio >= 0.7 ? 'Proche de la moyenne' : 'Sous la moyenne'}
                </Text>
              </View>
              <View style={styles.kpi}>
                <Calendar size={16} color={BLUE} />
                <CountUp value={s.postsPerWeek} style={styles.kpiValue} format={(n) => String(n).replace('.', ',')} />
                <Text style={styles.kpiLabel}>vidéos / semaine</Text>
                <Text style={styles.kpiSub}>{s.daysSinceLastPost === null ? '' : s.daysSinceLastPost === 0 ? 'Dernière : aujourd’hui' : `Dernière : il y a ${s.daysSinceLastPost} j`}</Text>
              </View>
              <View style={styles.kpi}>
                <Clock size={16} color={GREEN} />
                <CountUp value={s.avgDuration} style={styles.kpiValue} format={(n) => String(Math.round(n))} suffix=" s" />
                <Text style={styles.kpiLabel}>durée moyenne</Text>
                <Text style={styles.kpiSub}>{ins.duree_ideale ? `Idéal : ${ins.duree_ideale}` : ''}</Text>
              </View>
            </View>
          </Section>

          {/* ---------- Courbe ---------- */}
          {s.viewsSeries.length >= 3 ? (
            <Section title="Tes vues, vidéo après vidéo" Icon={TrendingUp} color={PINK}
              right={s.momentum ? <Text style={[styles.momentum, { color: s.momentum > 0 ? GREEN : RED }]}>{s.momentum > 0 ? '+' : ''}{s.momentum} %</Text> : null}>
              <View style={styles.card}>
                <ViewsChart series={s.viewsSeries} median={s.medianViews} width={chartW} />
                <View style={styles.legend}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: YELLOW }]} /><Text style={styles.legendText}>Ta meilleure</Text></View>
                  <View style={styles.legendItem}><View style={styles.legendDash} /><Text style={styles.legendText}>Ta médiane ({formatCount(s.medianViews)})</Text></View>
                </View>
                <Text style={styles.cardNote}>
                  {s.hitRate > 0 ? `${s.hitRate} % de tes vidéos font plus du double de tes vues habituelles.` : 'Aucune vidéo n’a encore doublé tes vues habituelles : ton prochain carton est à venir.'}
                </Text>
              </View>
            </Section>
          ) : null}

          {/* ---------- Quand publier ---------- */}
          {s.weekdayChart.some((d) => d.value) ? (
            <Section title="Quand publier" Icon={Calendar} color={BLUE}>
              <View style={styles.card}>
                <WeekBars data={s.weekdayChart} />
                <View style={styles.slotRow}>
                  {s.bestDays.slice(0, 1).map((d) => (
                    <View key={d.day} style={styles.slotChip}><Trophy size={14} color={YELLOW} /><Text style={styles.slotText}>{d.day}</Text></View>
                  ))}
                  {s.bestHours.slice(0, 1).map((h) => (
                    <View key={h.slot} style={styles.slotChip}><Clock size={14} color={BLUE} /><Text style={styles.slotText}>{h.slot}</Text></View>
                  ))}
                </View>
                <Text style={styles.cardNote}>Vues médianes selon le jour de publication, à l’heure de Paris et Bruxelles.</Text>
              </View>
            </Section>
          ) : null}

          {/* ---------- Top vidéos ---------- */}
          {a.topVideos.length ? (
            <Section title="Tes vidéos qui ont cartonné" Icon={Trophy} color={YELLOW}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingLeft: 20 }}>
                {a.topVideos.map((v, i) => <VideoCard key={v.id} v={v} rank={i + 1} onPress={() => openVideo(v)} />)}
              </ScrollView>
              {ins.meilleure_video.pourquoi ? (
                <View style={[styles.card, { marginTop: 12 }]}>
                  <Text style={styles.whyKicker}>POURQUOI TA MEILLEURE A MARCHÉ</Text>
                  <Text style={styles.whyText}>{ins.meilleure_video.pourquoi}</Text>
                  {best ? (
                    <TouchableOpacity onPress={() => openVideo(best)} style={styles.openRow}>
                      <ExternalLink size={13} color={PINK} /><Text style={styles.link}>Revoir la vidéo</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </Section>
          ) : null}

          {/* ---------- Priorité ---------- */}
          <Section title="Ta priorité n°1" Icon={Target} color={PINK}>
            <LinearGradient colors={['rgba(255,79,249,0.22)', 'rgba(144,19,254,0.14)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.priority}>
              <Text style={styles.priorityTitle}>{ins.conseil_principal.titre}</Text>
              <Text style={styles.priorityText}>{ins.conseil_principal.action}</Text>
            </LinearGradient>
          </Section>

          {/* ---------- Forces ---------- */}
          <Section title="Ce qui marche chez toi" Icon={CheckCircle2} color={GREEN}>
            {ins.points_forts.map((f) => (
              <View key={f.titre} style={styles.point}>
                <View style={[styles.pointIcon, { backgroundColor: 'rgba(66,255,176,0.14)' }]}><CheckCircle2 size={16} color={GREEN} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pointTitle}>{f.titre}</Text>
                  {f.detail ? <Text style={styles.pointText}>{f.detail}</Text> : null}
                </View>
              </View>
            ))}
          </Section>

          {/* ---------- Faiblesses ---------- */}
          <Section title="Ce qui te freine" Icon={AlertTriangle} color={YELLOW}>
            {locked ? (
              <Locked lines={ins.points_faibles.map((x) => x.titre)} label="Voir ce qui te freine et comment corriger" onUnlock={openPaywall} />
            ) : ins.points_faibles.map((f) => (
              <View key={f.titre} style={styles.point}>
                <View style={[styles.pointIcon, { backgroundColor: 'rgba(255,216,79,0.14)' }]}><AlertTriangle size={16} color={YELLOW} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pointTitle}>{f.titre}</Text>
                  <Text style={styles.pointText}>{f.detail}</Text>
                  {f.solution ? <View style={styles.fix}><Lightbulb size={13} color={GREEN} /><Text style={styles.fixText}>{f.solution}</Text></View> : null}
                </View>
              </View>
            ))}
          </Section>

          {/* ---------- Formats gagnants ---------- */}
          {ins.formats_gagnants.length ? (
            <Section title="Tes formats gagnants" Icon={Flame} color="#FF9F4F">
              {locked ? (
                <Locked lines={ins.formats_gagnants.map((x) => x.titre)} label="Débloquer tes formats gagnants" onUnlock={openPaywall} />
              ) : ins.formats_gagnants.map((f, i) => {
                const v = byId.get(f.video_id);
                return (
                  <TouchableOpacity key={f.titre} activeOpacity={v ? 0.85 : 1} onPress={() => openVideo(v)} style={styles.format}>
                    <Text style={styles.formatNum}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pointTitle}>{f.titre}</Text>
                      <Text style={styles.pointText}>{f.pourquoi}</Text>
                      {v ? <Text style={styles.formatEx}>Exemple : {formatCount(v.views)} vues · voir la vidéo</Text> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Section>
          ) : null}

          {/* ---------- Vidéo à retravailler ---------- */}
          {worst ? (
            <Section title="La vidéo à refaire en mieux" Icon={RefreshCw} color={BLUE}>
              {locked ? (
                <Locked lines={[`${formatCount(worst.views)} vues · ${worst.description.slice(0, 40) || 'Sans légende'}`, 'Pourquoi elle a moins marché', 'Comment la refaire']} label="Voir comment la refaire" onUnlock={openPaywall} />
              ) : (
                <View style={styles.card}>
                  <Text style={styles.worstMeta}>{formatCount(worst.views)} vues · « {worst.description.slice(0, 70) || 'Sans légende'} »</Text>
                  <Text style={styles.pointText}>{ins.video_a_retravailler.pourquoi}</Text>
                  <View style={styles.fix}><Lightbulb size={13} color={GREEN} /><Text style={styles.fixText}>{ins.video_a_retravailler.comment}</Text></View>
                </View>
              )}
            </Section>
          ) : null}

          {/* ---------- Plan de la semaine ---------- */}
          {ins.plan_semaine.length ? (
            <Section title="Ton plan pour la semaine" Icon={Calendar} color={PINK}>
              {locked ? (
                <Locked lines={ins.plan_semaine.map((x) => `${x.jour} · idée de vidéo sur mesure`)} label="Débloquer ton plan de la semaine" onUnlock={openPaywall} />
              ) : ins.plan_semaine.map((d, i) => (
                <MotiView key={`${d.jour}-${i}`} from={{ opacity: 0, translateX: 16 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: i * 90 }} style={styles.day}>
                  <LinearGradient colors={[PINK, VIOLET]} style={styles.dayBadge}><Text style={styles.dayText}>{d.jour.slice(0, 3)}</Text></LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pointTitle}>{d.idee}</Text>
                    <Text style={styles.dayFormat}>{d.format}</Text>
                    {d.accroche ? <Text style={styles.dayHook}>Accroche : « {d.accroche} »</Text> : null}
                  </View>
                </MotiView>
              ))}
            </Section>
          ) : null}

          {/* ---------- Objectif + à éviter ---------- */}
          {!locked && (ins.objectif_30_jours || ins.a_eviter.length) ? (
            <Section title="Objectif 30 jours" Icon={Target} color={GREEN}>
              {ins.objectif_30_jours ? (
                <View style={[styles.card, { borderColor: 'rgba(66,255,176,0.35)' }]}><Text style={styles.goalText}>{ins.objectif_30_jours}</Text></View>
              ) : null}
              {ins.a_eviter.length ? (
                <View style={[styles.card, { marginTop: 10 }]}>
                  <Text style={styles.whyKicker}>À ÉVITER</Text>
                  {ins.a_eviter.map((x) => (
                    <View key={x} style={styles.avoid}><Ban size={14} color={RED} /><Text style={styles.avoidText}>{x}</Text></View>
                  ))}
                </View>
              ) : null}
            </Section>
          ) : null}

          {locked ? (
            <TouchableOpacity activeOpacity={0.92} onPress={openPaywall} style={{ marginTop: 28 }}>
              <LinearGradient colors={['#FF4FF9', '#B53CFF', '#7B1FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.upsell}>
                <Crown size={26} color="#FFF" />
                <Text style={styles.upsellTitle}>Ton bilan complet, chaque semaine</Text>
                <Text style={styles.upsellText}>Ce qui te freine, tes formats gagnants, ton plan de la semaine et ta progression semaine après semaine.</Text>
                <View style={styles.upsellBtn}><Text style={styles.upsellBtnText}>Passer à Premium</Text></View>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.footer}>
            Bilan du {frDate(a.generatedAt)} · {s.analysedVideos} vidéos analysées{'\n'}
            Données publiques de ton profil TikTok
          </Text>
          <TouchableOpacity onPress={() => saveCreatorProfile({ tiktok: '' }, uid)}><Text style={[styles.link, { textAlign: 'center', marginTop: 8 }]}>Changer de compte TikTok</Text></TouchableOpacity>
        </View>
      </ScrollView>
      {running ? (
        <View style={styles.refreshing}><ActivityIndicator color="#FFF" /><Text style={styles.refreshingText}>Mise à jour de ton bilan…</Text></View>
      ) : null}
      {error && a ? (
        <View style={[styles.refreshing, { backgroundColor: 'rgba(255,107,138,0.95)' }]}><Text style={styles.refreshingText}>{error.message}</Text></View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 6 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { color: '#FFF', fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  emptyText: { color: MUTED, fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  link: { color: PINK, fontSize: 14, fontWeight: '700' },

  aurora1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,79,249,0.22)', top: -60, right: -80 },
  aurora2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(79,195,255,0.12)', top: 120, left: -90 },
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  avatarRing: { padding: 4, borderRadius: 64 },
  avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 4, borderColor: '#1A0633' },
  avatarLetter: { color: '#FFF', fontSize: 40, fontWeight: '900' },
  name: { color: '#FFF', fontSize: 25, fontWeight: '900', marginTop: 14, letterSpacing: -0.3 },
  handle: { color: MUTED, fontSize: 14, fontWeight: '600', marginTop: 3 },
  heroStats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroValue: { color: '#FFF', fontSize: 23, fontWeight: '900' },
  heroLabel: { color: FAINT, fontSize: 12, fontWeight: '700', marginTop: 2 },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(66,255,176,0.12)' },
  deltaText: { color: GREEN, fontSize: 13, fontWeight: '800' },

  body: { paddingHorizontal: 20 },
  scoreCard: { marginTop: 18, backgroundColor: CARD, borderRadius: 26, padding: 18, borderWidth: 1, borderColor: BORDER },
  scoreTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ringValue: { color: '#FFF', fontSize: 40, fontWeight: '900', lineHeight: 44 },
  ringMax: { color: FAINT, fontSize: 12, fontWeight: '800' },
  scoreKicker: { color: FAINT, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  scoreWord: { fontSize: 19, fontWeight: '900', marginTop: 1 },
  partRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  partLabel: { color: MUTED, fontSize: 12, fontWeight: '700' },
  partValue: { fontSize: 12, fontWeight: '900' },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  verdict: { color: '#FFF', fontSize: 19, fontWeight: '900', lineHeight: 25 },
  resume: { color: MUTED, fontSize: 14.5, lineHeight: 21, marginTop: 8 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', flex: 1 },
  card: { backgroundColor: CARD, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: BORDER },
  cardNote: { color: FAINT, fontSize: 12.5, lineHeight: 17, marginTop: 12 },

  dnaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dna: { width: '48%', flexGrow: 1, backgroundColor: CARD, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: BORDER, gap: 4 },
  dnaLabel: { color: FAINT, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  dnaValue: { color: '#FFF', fontSize: 15, fontWeight: '800', lineHeight: 20 },
  aiNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,79,249,0.08)' },
  aiNoteText: { color: '#F2D6FF', fontSize: 12.5, lineHeight: 17, flex: 1, fontWeight: '600' },

  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpi: { width: '48%', flexGrow: 1, backgroundColor: CARD, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: BORDER },
  kpiValue: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 8 },
  kpiLabel: { color: MUTED, fontSize: 12.5, fontWeight: '700' },
  kpiSub: { color: FAINT, fontSize: 11.5, fontWeight: '700', marginTop: 6 },

  momentum: { fontSize: 14, fontWeight: '900' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDash: { width: 14, height: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.5)' },
  legendText: { color: FAINT, fontSize: 12, fontWeight: '600' },

  week: { flexDirection: 'row', gap: 6, height: 150, alignItems: 'flex-end' },
  weekCol: { flex: 1, alignItems: 'center', height: '100%' },
  weekVal: { color: FAINT, fontSize: 10, fontWeight: '800', height: 16 },
  weekTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  weekDay: { color: FAINT, fontSize: 11, fontWeight: '800', marginTop: 6 },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  slotChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  slotText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  vCard: { width: 150, height: 230, borderRadius: 20, overflow: 'hidden', backgroundColor: '#1A0633' },
  vRank: { position: 'absolute', top: 10, left: 10, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  vRankText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  vBottom: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  vViews: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  vViewsText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  vDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, lineHeight: 15, marginTop: 4 },
  vEng: { color: GREEN, fontSize: 11, fontWeight: '800', marginTop: 4 },
  whyKicker: { color: FAINT, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  whyText: { color: '#FFF', fontSize: 14.5, lineHeight: 21, marginTop: 6 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },

  priority: { borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(255,79,249,0.4)' },
  priorityTitle: { color: '#FFF', fontSize: 19, fontWeight: '900' },
  priorityText: { color: '#F2D6FF', fontSize: 14.5, lineHeight: 21, marginTop: 6 },

  point: { flexDirection: 'row', gap: 12, backgroundColor: CARD, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  pointIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pointTitle: { color: '#FFF', fontSize: 15, fontWeight: '800', lineHeight: 20 },
  pointText: { color: MUTED, fontSize: 13.5, lineHeight: 19, marginTop: 3 },
  fix: { flexDirection: 'row', gap: 6, marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: 'rgba(66,255,176,0.08)' },
  fixText: { color: '#CFFFEA', fontSize: 13, lineHeight: 18, flex: 1 },

  format: { flexDirection: 'row', gap: 12, backgroundColor: CARD, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  formatNum: { color: '#FF9F4F', fontSize: 26, fontWeight: '900', width: 24 },
  formatEx: { color: PINK, fontSize: 12, fontWeight: '700', marginTop: 6 },
  worstMeta: { color: '#FFF', fontSize: 13.5, fontWeight: '700', marginBottom: 6 },

  day: { flexDirection: 'row', gap: 12, backgroundColor: CARD, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  dayBadge: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  dayFormat: { color: BLUE, fontSize: 12.5, fontWeight: '700', marginTop: 3 },
  dayHook: { color: MUTED, fontSize: 13, fontStyle: 'italic', marginTop: 5 },
  goalText: { color: '#FFF', fontSize: 15, lineHeight: 22, fontWeight: '700' },
  avoid: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 9 },
  avoidText: { color: MUTED, fontSize: 13.5, lineHeight: 19, flex: 1 },

  locked: { backgroundColor: CARD, borderRadius: 20, padding: 16, paddingBottom: 74, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  lockedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: YELLOW },
  lockedTitle: { color: '#FFF', fontSize: 14.5, fontWeight: '800', flexShrink: 1 },
  lockedBlur: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.12)' },
  lockedCta: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  lockedBtn: { height: 46, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  lockedBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },

  upsell: { borderRadius: 26, padding: 22, alignItems: 'center' },
  upsellTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  upsellText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  upsellBtn: { marginTop: 16, height: 50, alignSelf: 'stretch', borderRadius: 999, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  upsellBtnText: { color: '#5A0FB0', fontSize: 16, fontWeight: '900' },
  footer: { color: FAINT, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 28 },

  cta: { height: 54, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  refreshing: { position: 'absolute', left: 20, right: 20, bottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: 'rgba(155,77,255,0.95)' },
  refreshingText: { color: '#FFF', fontSize: 14, fontWeight: '800', flexShrink: 1, textAlign: 'center' },

  scan: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
  radar: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  radarWave: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: PINK },
  radarSpin: { position: 'absolute', width: 160, height: 160, borderRadius: 80, opacity: 0.35 },
  radarCore: { width: 108, height: 108, borderRadius: 54, backgroundColor: '#1A0633', borderWidth: 3, borderColor: PINK, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  radarAvatar: { width: '100%', height: '100%' },
  radarAt: { color: PINK, fontSize: 44, fontWeight: '900' },
  scanTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 26, textAlign: 'center' },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scanDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  scanText: { color: MUTED, fontSize: 15, fontWeight: '700' },
  scanHint: { color: FAINT, fontSize: 13, marginTop: 26 },

  linkCard: { borderRadius: 26, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,79,249,0.3)' },
  linkIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: 'rgba(255,79,249,0.3)', alignItems: 'center', justifyContent: 'center' },
  linkTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 14 },
  linkText: { color: MUTED, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  linkInput: { alignSelf: 'stretch', height: 58, borderRadius: 18, marginTop: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5, borderColor: BORDER },
  linkAt: { color: PINK, fontSize: 20, fontWeight: '900' },
  linkField: { flex: 1, height: '100%', color: '#FFF', fontSize: 18, fontWeight: '700' },
  linkErr: { color: '#FF8FA8', fontSize: 13, fontWeight: '600', marginTop: 8, alignSelf: 'flex-start' },
  linkSafe: { color: FAINT, fontSize: 12.5, marginTop: 14 },
});

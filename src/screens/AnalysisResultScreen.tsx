import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, useWindowDimensions, LayoutChangeEvent, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line, Circle, Text as SvgText } from 'react-native-svg';
import {
  ChevronLeft, Zap, Scissors, Video, Music2, MessageCircle, Target, Wrench, ThumbsUp, AlertTriangle,
  Copy, Clock, Lightbulb, Lock, Sparkles, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, TrendingDown, Heart,
  MessageSquare, Share2, Volume2, VolumeX, Play, Pause, Square, CheckSquare, RefreshCw, Film, Eye, ListChecks, XCircle, Smile, Flame, Users, Music, ExternalLink, Megaphone,
} from 'lucide-react-native';
import TrendingSoundsSuggestion from '../components/analysis/TrendingSoundsSuggestion';
import { pickVideo } from '../utils/pickVideo';
import { useAnalysisGate } from '../hooks/useAnalysisGate';
import { useRevenueCat } from '../context/RevenueCatContext';

// ---------- Données ----------

type PillarKey = 'accroche' | 'rythme' | 'image' | 'son' | 'message';
interface View2 {
  score: number;
  verdict: string;
  avis: string;
  resume: string;
  type_video: string;
  duree: number;
  pret: boolean;
  piliers: Record<PillarKey, { note: number; commentaire: string; conseil?: string }> | null;
  retention: { t: number; pct: number }[] | null;
  moments: { t: number; type: 'fort' | 'faible'; titre: string; detail: string }[];
  priorite: { titre: string; pourquoi: string; action: string } | null;
  corrections: { moment: string; probleme: string; solution: string; comment?: string; impact?: 'fort' | 'moyen' | 'faible' }[];
  /** Version gratuite : ce qui est caché, en chiffres (pour donner envie de débloquer) */
  teaser?: { corrections: number; premier_probleme: { moment: string; probleme: string } | null; moments_faibles: number; accroches: number; plans_montage: number; hashtags: number } | null;
  decoupage: { debut: number; fin: number; role: string; description: string }[];
  emotions: { humour: number; surprise: number; curiosite: number; emotion: number; inspiration: number } | null;
  emotionDominante: string;
  checklist: { point: string; ok: boolean; detail: string }[];
  accroches: { texte_ecran: string; phrase: string; pourquoi: string }[];
  tendances: { dans_la_tendance: boolean; explication: string; son_conseille: string; son_url: string; format_conseille: string; hashtags_du_moment: string[] } | null;
  publicCible: { cible: string; pourquoi: string } | null;
  montage: { debut: number; fin: number; action: string; texte_ecran: string }[];
  potentiel: number | null;
  forts: string[];
  faibles: string[];
  idees: string[];
  legende: string;
  hashtags: string[];
  horaires: string[];
  risque: { niveau: string; detail: string } | null;
  engagement: { likes: number; commentaires: number; partages: number } | null;
  limited: boolean;
}

const arr = (v: any) => (Array.isArray(v) ? v.filter(Boolean) : []);

/** Résultat brut (v2 ou ancien format) → données de l'écran. */
const toView = (a: any): View2 => {
  const limited = a?.limited === true;
  if (a?.version === 2) {
    return {
      score: a.score, verdict: a.verdict, avis: a.avis, resume: a.resume, type_video: a.type_video, duree: a.duree_secondes,
      pret: !!a.pret_a_publier, piliers: a.piliers ?? null, retention: arr(a.retention).length >= 3 ? a.retention : null,
      moments: arr(a.moments), priorite: a.priorite ?? null, corrections: arr(a.corrections),
      decoupage: arr(a.decoupage), emotions: a.emotions ?? null, emotionDominante: a.emotion_dominante ?? '',
      checklist: arr(a.checklist), accroches: arr(a.accroches), tendances: a.tendances ?? null,
      publicCible: a.public?.cible ? a.public : null,
      montage: arr(a.montage_ideal),
      potentiel: typeof a.score_potentiel === 'number' && a.score_potentiel > a.score ? a.score_potentiel : null,
      forts: arr(a.points_forts), faibles: arr(a.points_faibles), idees: arr(a.idees), legende: a.legende ?? '',
      hashtags: arr(a.hashtags), horaires: arr(a.meilleurs_horaires), risque: a.risque ?? null, engagement: a.engagement ?? null, limited,
      teaser: limited ? a.apercu_premium ?? null : null,
    };
  }
  // Ancien format (analyses faites avant la mise à jour)
  const mi = a?.micro_indicateurs ?? {};
  const se = a?.score_emotionnel ?? {};
  const hasPillars = typeof mi.audio === 'number';
  const fixes = arr(a?.conseils_rapides).map((c: any) => ({ moment: '', probleme: c.titre, solution: c.texte }));
  return {
    score: Number(a?.score_sur_100) || 0,
    verdict: a?.score_titre || a?.verdict_express || '',
    avis: a?.avis_global?.court || '',
    resume: a?.resume_video?.court || '',
    type_video: a?.type_video_detecte || '',
    duree: 0,
    pret: false,
    piliers: hasPillars ? {
      accroche: { note: mi.trendiness ?? 0, commentaire: '' },
      rythme: { note: mi.montage ?? 0, commentaire: '' },
      image: { note: se.impact_visuel ?? mi.montage ?? 0, commentaire: '' },
      son: { note: mi.audio ?? 0, commentaire: '' },
      message: { note: se.confiance_charisme ?? 0, commentaire: '' },
    } : null,
    retention: null,
    moments: [],
    priorite: arr(a?.optimisation_express)[0] ? { titre: 'À faire en premier', pourquoi: '', action: arr(a.optimisation_express)[0] } : null,
    corrections: fixes,
    decoupage: [],
    emotions: null,
    emotionDominante: '',
    checklist: [],
    accroches: [],
    tendances: null,
    publicCible: null,
    montage: [],
    potentiel: null,
    forts: arr(a?.pourquoi_ca_perce?.complet).length ? arr(a.pourquoi_ca_perce.complet) : arr(a?.pourquoi_ca_perce?.preview),
    faibles: arr(a?.pourquoi_ca_floppe?.complet).length ? arr(a.pourquoi_ca_floppe.complet) : arr(a?.pourquoi_ca_floppe?.preview),
    idees: arr(a?.inspiration_ia),
    legende: a?.caption ?? '',
    hashtags: arr(a?.hashtags).map((h: string) => String(h).replace(/^#/, '')),
    horaires: arr(a?.meilleurs_horaires),
    risque: a?.indice_risque ? { niveau: a.indice_risque, detail: a.indice_risque_detail ?? '' } : null,
    engagement: a?.potentiel_partage ? { likes: a.potentiel_partage.potentiel_like, commentaires: a.potentiel_partage.potentiel_commentaire, partages: a.potentiel_partage.potentiel_partage } : null,
    limited,
  };
};

// ---------- Style ----------

const PINK = '#FF4FF9';
const CARD_BG = '#160628';
const CARD_BORDER = 'rgba(179, 113, 255, 0.28)';
const PILLARS: { key: PillarKey; label: string; Icon: any; color: string }[] = [
  { key: 'accroche', label: 'Accroche', Icon: Zap, color: PINK },
  { key: 'rythme', label: 'Rythme', Icon: Scissors, color: '#4FC3FF' },
  { key: 'image', label: 'Image', Icon: Video, color: '#42FFB0' },
  { key: 'son', label: 'Son', Icon: Music2, color: '#FFD84F' },
  { key: 'message', label: 'Message', Icon: MessageCircle, color: '#B371FF' },
];

const scoreColor = (s: number) => (s >= 80 ? '#42FFB0' : s >= 65 ? '#4FC3FF' : s >= 50 ? '#FFD84F' : '#FF6B8A');
const fmtT = (t: number) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;

const copy = async (text: string, label: string) => {
  await Clipboard.setStringAsync(text);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  Alert.alert(label, 'Colle-le directement dans TikTok.');
};

// ---------- Petits composants ----------

const Card = ({ icon, title, right, children, delay = 0, accent }: { icon?: React.ReactNode; title?: string; right?: React.ReactNode; children: React.ReactNode; delay?: number; accent?: string }) => (
  <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay }} style={[styles.card, accent ? { borderColor: accent } : null]}>
    {title ? (
      <View style={styles.cardHeader}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
        {right}
      </View>
    ) : null}
    {children}
  </MotiView>
);

/** Section réservée à Premium : aperçu flouté + bouton. */
const Locked = ({ onUnlock, lines = 3, label = 'Débloquer avec Premium', why }: { onUnlock: () => void; lines?: number; label?: string; why?: string }) => (
  <TouchableOpacity activeOpacity={0.88} onPress={onUnlock} style={[styles.locked, why ? { minHeight: 118 } : null]}>
    <View style={{ gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => <View key={i} style={[styles.ghost, { width: `${90 - i * 18}%` }]} />)}
    </View>
    <BlurView intensity={25} tint="dark" style={styles.lockedOverlay}>
      {why ? <Text style={styles.lockWhy}>{why}</Text> : null}
      <View style={styles.lockPill}><Lock size={14} color="#FFF" /><Text style={styles.lockText}>{label}</Text></View>
    </BlurView>
  </TouchableOpacity>
);

const PillarBar = ({ label, Icon, color, note, commentaire, conseil, delay }: any) => (
  <View style={styles.pillar}>
    <View style={styles.pillarHead}>
      <View style={[styles.pillarIcon, { backgroundColor: `${color}22` }]}><Icon size={15} color={color} /></View>
      <Text style={styles.pillarLabel}>{label}</Text>
      <Text style={[styles.pillarNote, { color: scoreColor(note) }]}>{note}</Text>
    </View>
    <View style={styles.pillarTrack}>
      <MotiView from={{ width: '0%' }} animate={{ width: `${Math.max(3, note)}%` }} transition={{ type: 'timing', duration: 900, delay }} style={styles.pillarFill}>
        <LinearGradient colors={[`${color}AA`, color]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </MotiView>
    </View>
    {commentaire ? <Text style={styles.pillarComment}>{commentaire}</Text> : null}
    {conseil ? <Text style={styles.pillarAdvice}>→ {conseil}</Text> : null}
  </View>
);

const ROLE_COLORS: Record<string, string> = {
  accroche: PINK, 'développement': '#4FC3FF', 'moment fort': '#42FFB0', 'temps mort': '#FF6B8A', chute: '#FFD84F', 'appel à l’action': '#B371FF',
};

/** « Ce que l'IA a vu » : la vidéo découpée séquence par séquence. */
const Breakdown = ({ items, onSeek }: { items: View2['decoupage']; onSeek?: (t: number) => void }) => {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 4);
  return (
    <View>
      {shown.map((d, i) => {
        const c = ROLE_COLORS[d.role] ?? '#4FC3FF';
        return (
          <View key={i} style={styles.seg}>
            <View style={styles.segRail}>
              <View style={[styles.segDot, { backgroundColor: c }]} />
              {i < shown.length - 1 ? <View style={styles.segLine} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 14 }}>
              <View style={styles.segHead}>
                <TouchableOpacity disabled={!onSeek} onPress={() => onSeek?.(d.debut)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={styles.segTimeBtn}>
                  <Play size={10} color="#4FC3FF" fill="#4FC3FF" />
                  <Text style={styles.segTime}>{fmtT(d.debut)} – {fmtT(d.fin)}</Text>
                </TouchableOpacity>
                <View style={[styles.segRole, { backgroundColor: `${c}22` }]}><Text style={[styles.segRoleText, { color: c }]}>{d.role}</Text></View>
              </View>
              <Text style={styles.segText}>{d.description}</Text>
            </View>
          </View>
        );
      })}
      {items.length > 4 ? (
        <TouchableOpacity onPress={() => setAll((x) => !x)} style={styles.more}>
          <Text style={styles.moreText}>{all ? 'Voir moins' : items.length - 4 === 1 ? 'Voir la dernière séquence' : `Voir les ${items.length - 4} autres séquences`}</Text>
          {all ? <ChevronUp size={16} color="#B371FF" /> : <ChevronDown size={16} color="#B371FF" />}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const EMOTIONS: { key: keyof NonNullable<View2['emotions']>; label: string; emoji: string; color: string }[] = [
  { key: 'humour', label: 'Humour', emoji: '😂', color: '#FFD84F' },
  { key: 'surprise', label: 'Surprise', emoji: '😮', color: '#4FC3FF' },
  { key: 'curiosite', label: 'Curiosité', emoji: '🧐', color: '#B371FF' },
  { key: 'emotion', label: 'Émotion', emoji: '🥹', color: PINK },
  { key: 'inspiration', label: 'Inspiration', emoji: '✨', color: '#42FFB0' },
];

const IMPACT = { fort: { label: 'Impact fort', color: '#FF6B8A' }, moyen: { label: 'Impact moyen', color: '#FFD84F' }, faible: { label: 'Impact faible', color: '#4FC3FF' } } as const;

/** Courbe de rétention estimée, avec les moments clés placés dessus. */
const RetentionChart = ({ points, moments, duree, showMoments }: { points: { t: number; pct: number }[]; moments: View2['moments']; duree: number; showMoments: boolean }) => {
  const [w, setW] = useState(0);
  const H = 150;
  const padL = 30, padB = 20, padT = 10;
  const total = Math.max(duree, points[points.length - 1]?.t ?? 1, 1);
  const x = (t: number) => padL + (t / total) * (w - padL - 6);
  const y = (p: number) => padT + (1 - p / 100) * (H - padT - padB);
  const pctAt = (t: number) => {
    for (let i = 1; i < points.length; i++) {
      if (t <= points[i].t) {
        const a = points[i - 1], b = points[i];
        const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
        return a.pct + (b.pct - a.pct) * k;
      }
    }
    return points[points.length - 1].pct;
  };

  const { line, area } = useMemo(() => {
    if (!w) return { line: '', area: '' };
    const P = points.map((p) => [x(p.t), y(p.pct)]);
    let d = `M${P[0][0]} ${P[0][1]}`;
    for (let i = 1; i < P.length; i++) {
      const [x0, y0] = P[i - 1];
      const [x1, y1] = P[i];
      const cx = (x0 + x1) / 2;
      d += ` C${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    const last = P[P.length - 1];
    return { line: d, area: `${d} L${last[0]} ${H - padB} L${P[0][0]} ${H - padB} Z` };
  }, [w, points]); // eslint-disable-line react-hooks/exhaustive-deps

  const endPct = points[points.length - 1]?.pct ?? 0;

  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      {w ? (
        <Svg width={w} height={H}>
          <Defs>
            <SvgGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={PINK} stopOpacity="0.35" />
              <Stop offset="1" stopColor={PINK} stopOpacity="0" />
            </SvgGradient>
            <SvgGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#42FFB0" />
              <Stop offset="0.5" stopColor="#FFD84F" />
              <Stop offset="1" stopColor={PINK} />
            </SvgGradient>
          </Defs>
          {[100, 50, 0].map((g) => (
            <React.Fragment key={g}>
              <Line x1={padL} x2={w - 6} y1={y(g)} y2={y(g)} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              <SvgText x={padL - 6} y={y(g) + 4} fill="rgba(234,226,247,0.45)" fontSize="10" textAnchor="end">{`${g}%`}</SvgText>
            </React.Fragment>
          ))}
          <Path d={area} fill="url(#area)" />
          <Path d={line} stroke="url(#stroke)" strokeWidth={3} fill="none" strokeLinecap="round" />
          {showMoments ? moments.map((m, i) => (
            <Circle key={i} cx={x(m.t)} cy={y(pctAt(m.t))} r={6} fill={m.type === 'fort' ? '#42FFB0' : '#FF6B8A'} stroke="#0A0214" strokeWidth={2} />
          )) : null}
          <SvgText x={padL} y={H - 4} fill="rgba(234,226,247,0.45)" fontSize="10">0:00</SvgText>
          <SvgText x={w - 6} y={H - 4} fill="rgba(234,226,247,0.45)" fontSize="10" textAnchor="end">{fmtT(total)}</SvgText>
        </Svg>
      ) : <View style={{ height: H }} />}
      <Text style={styles.chartNote}>
        Environ <Text style={{ color: '#FFF', fontWeight: '800' }}>{endPct} %</Text> des spectateurs iraient jusqu’au bout · estimation de l’IA
      </Text>
    </View>
  );
};

const parseT = (m: string) => { const [a, b] = m.split(':').map(Number); return (a || 0) * 60 + (b || 0); };

/** Minutage cliquable : fait sauter la vidéo à ce moment. */
const TimeChip = ({ t, onSeek }: { t: string; onSeek?: (s: number) => void }) => (
  <TouchableOpacity disabled={!onSeek} onPress={() => onSeek?.(parseT(t))} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} style={styles.timeChip}>
    {onSeek ? <Play size={10} color="#4FC3FF" fill="#4FC3FF" /> : <Clock size={11} color="#4FC3FF" />}
    <Text style={styles.timeText}>{t}</Text>
  </TouchableOpacity>
);

/** Petit anneau de note pour un pilier. */
const PillarRing = ({ note, color, label, Icon, active, onPress, size }: any) => {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.ringItem, active && { backgroundColor: `${color}1A`, borderColor: `${color}66` }]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={4} fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round"
            strokeDasharray={`${c}`} strokeDashoffset={c * (1 - note / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </Svg>
        <Text style={styles.ringItemValue}>{note}</Text>
      </View>
      <View style={styles.ringItemLabelRow}>
        <Icon size={11} color={color} />
        <Text style={styles.ringItemLabel} numberOfLines={1}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

type Tab = 'resume' | 'video' | 'ameliorer' | 'publier';
const TABS: { key: Tab; label: string; premium?: boolean }[] = [
  { key: 'resume', label: 'Résumé' },
  { key: 'video', label: 'Ta vidéo' },
  { key: 'ameliorer', label: 'Améliorer', premium: true },
  { key: 'publier', label: 'Publier', premium: true },
];

// ---------- Écran ----------

/** Onglet réservé à Premium : ce qu'on y trouve + bouton. */
const LockedTab = ({ title, why, items, onUnlock, cta = 'Débloquer mon analyse complète', foot }: { title: string; why?: string; items: string[]; onUnlock: () => void; cta?: string; foot?: string }) => (
  <View style={styles.lockedTab}>
    <View style={styles.lockedTabIcon}><Lock size={22} color="#FFF" /></View>
    <Text style={styles.lockedTabTitle}>{title}</Text>
    {why ? <Text style={styles.lockedTabWhy}>{why}</Text> : null}
    {items.map((it) => (
      <View key={it} style={styles.lockedTabRow}>
        <CheckCircle2 size={16} color="#42FFB0" />
        <Text style={styles.lockedTabText}>{it}</Text>
      </View>
    ))}
    <TouchableOpacity activeOpacity={0.9} onPress={onUnlock} style={{ alignSelf: 'stretch', marginTop: 16 }}>
      <LinearGradient colors={[PINK, '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
        <Sparkles size={18} color="#FFF" />
        <Text style={styles.ctaText}>{cta}</Text>
      </LinearGradient>
    </TouchableOpacity>
    {foot ? <Text style={styles.lockedTabFoot}>{foot}</Text> : null}
  </View>
);

export default function AnalysisResultScreen({ navigation, route }: any) {
  const { result, videoUri } = route.params;
  const raw = result?.premium || result;
  const v = useMemo(() => toView(raw), [raw]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const videoRef = useRef<ExpoVideo>(null);
  const [tab, setTab] = useState<Tab>('resume');
  const [pillar, setPillar] = useState<PillarKey>(() => {
    if (!v.piliers) return 'accroche';
    return PILLARS.reduce((low, p) => (v.piliers![p.key].note < v.piliers![low].note ? p.key : low), 'accroche' as PillarKey);
  });
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(v.duree || 0);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const openPaywall = () => navigation.navigate('Paywall');
  const { annualPackage, monthlyPackage } = useRevenueCat();
  const trialAvailable = [annualPackage, monthlyPackage].some((p) => p?.product.introPrice?.price === 0);
  const gate = useAnalysisGate(navigation);
  const locked = v.limited;
  const sc = scoreColor(v.score);
  const fixesCount = v.corrections.length;
  // Textes des cadenas : chiffres réels de SA vidéo, pour qu'il sache ce qu'il débloque
  const t = v.teaser;
  const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
  const gain = v.potentiel ? `de ${v.score} à ${v.potentiel}/100` : null;
  const trialFoot = trialAvailable ? '3 jours gratuits · sans engagement' : 'Sans engagement · annule quand tu veux';
  const videoW = Math.min(190, width * 0.44);
  const ringSize = Math.min(52, (width - 44 - 36 - 40) / 5);

  const seek = async (t: number) => {
    Haptics.selectionAsync();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    try {
      await videoRef.current?.setPositionAsync(Math.max(0, t) * 1000);
      await videoRef.current?.playAsync();
      setPlaying(true);
      setMuted(false);
    } catch {}
  };
  const canSeek = !!videoUri;
  const togglePlay = async () => {
    try {
      if (playing) await videoRef.current?.pauseAsync(); else await videoRef.current?.playAsync();
      setPlaying(!playing);
    } catch {}
  };

  // Repères sur la barre de lecture
  const markers = useMemo(() => {
    const list: { t: number; color: string }[] = v.moments.map((m) => ({ t: m.t, color: m.type === 'fort' ? '#42FFB0' : '#FF6B8A' }));
    return locked ? [] : list;
  }, [v.moments, locked]);
  const total = Math.max(dur, v.duree, 1);

  const recheck = async () => {
    if (!(await gate())) return;
    const video = await pickVideo();
    if (video) navigation.replace('VideoAnalyzing', { videoUri: video.uri });
  };

  const doneCount = Object.values(done).filter(Boolean).length;
  const selected = v.piliers ? v.piliers[pillar] : null;
  const selectedMeta = PILLARS.find((p) => p.key === pillar)!;

  // ---------- Onglets ----------

  const resume = (
    <>
      <Card delay={40}>
        <Text style={styles.coachLabel}>L’avis de ton coach</Text>
        <Text style={styles.coachText}>{v.avis}</Text>
      </Card>

      {v.priorite ? (
        <LinearGradient colors={['rgba(255,79,249,0.22)', 'rgba(144,19,254,0.16)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.priority}>
          <View style={styles.cardHeader}>
            <Target size={18} color={PINK} />
            <Text style={[styles.cardTitle, { color: PINK, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 }]}>Ta priorité n°1</Text>
          </View>
          <Text style={styles.priorityTitle}>{v.priorite.titre}</Text>
          {v.priorite.pourquoi ? <Text style={styles.priorityWhy}>{v.priorite.pourquoi}</Text> : null}
          {v.priorite.action ? <View style={styles.priorityAction}><Text style={styles.priorityActionText}>→ {v.priorite.action}</Text></View> : null}
        </LinearGradient>
      ) : null}

      {v.piliers ? (
        <Card title="Tes 5 piliers" icon={<Sparkles size={18} color="#B371FF" />} delay={80}>
          <View style={styles.rings}>
            {PILLARS.map((p) => (
              <PillarRing key={p.key} size={ringSize} note={v.piliers![p.key].note} color={p.color} label={p.label} Icon={p.Icon}
                active={pillar === p.key} onPress={() => { Haptics.selectionAsync(); setPillar(p.key); }} />
            ))}
          </View>
          {selected ? (
            <MotiView key={pillar} from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} style={styles.pillarDetail}>
              <Text style={[styles.pillarDetailTitle, { color: selectedMeta.color }]}>{selectedMeta.label} · {selected.note}/100</Text>
              {selected.commentaire ? <Text style={styles.pillarComment}>{selected.commentaire}</Text> : null}
              {selected.conseil ? <Text style={styles.pillarAdvice}>→ {selected.conseil}</Text> : null}
            </MotiView>
          ) : null}
          <Text style={styles.ringsHint}>Touche un pilier pour voir le détail</Text>
        </Card>
      ) : null}

      {v.potentiel ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setTab('ameliorer')}>
          <View style={styles.potential}>
            <View style={styles.potentialScores}>
              <Text style={[styles.potentialNow, { color: sc }]}>{v.score}</Text>
              <Text style={styles.potentialArrow}>→</Text>
              <Text style={[styles.potentialNext, { color: scoreColor(v.potentiel) }]}>{v.potentiel}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.potentialTitle}>Ta note possible</Text>
              <Text style={styles.potentialText}>si tu appliques les corrections · estimation de l’IA</Text>
            </View>
            <ChevronDown size={18} color="rgba(255,255,255,0.5)" style={{ transform: [{ rotate: '-90deg' }] }} />
          </View>
        </TouchableOpacity>
      ) : null}

      <Card title="À corriger en priorité" icon={<Wrench size={18} color={PINK} />} delay={120}>
        {locked ? (
          t?.corrections ? (
            <View>
              <Text style={styles.teaseLead}>
                L’IA a repéré <Text style={styles.teaseStrong}>{plural(t.corrections, 'erreur', 'erreurs')}</Text> qui font décrocher tes spectateurs.
              </Text>
              {t.premier_probleme ? (
                <View style={styles.teaseFix}>
                  <View style={styles.fixNum}><Text style={styles.fixNumText}>1</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickFixText}>{t.premier_probleme.moment ? `${t.premier_probleme.moment} · ` : ''}{t.premier_probleme.probleme}</Text>
                    <Text style={styles.teaseHidden}>🔒 La solution exacte, étape par étape</Text>
                  </View>
                </View>
              ) : null}
              <Locked
                onUnlock={openPaywall}
                lines={2}
                label="Voir comment tout corriger"
                why={t.corrections > 1 ? `+ ${plural(t.corrections - 1, 'autre erreur', 'autres erreurs')} et leurs solutions` : 'La solution, expliquée pas à pas'}
              />
            </View>
          ) : <Locked onUnlock={openPaywall} label="Voir les corrections" why="Ce qu’il faut changer pour que ta vidéo perce" />
        ) : v.corrections.length ? (
          <>
            {v.corrections.slice(0, 3).map((c, i) => (
              <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => setTab('ameliorer')} style={[styles.quickFix, i > 0 && styles.divider]}>
                <View style={styles.fixNum}><Text style={styles.fixNumText}>{i + 1}</Text></View>
                <Text style={styles.quickFixText} numberOfLines={2}>{c.probleme}</Text>
                {c.impact ? <View style={[styles.impactDot, { backgroundColor: IMPACT[c.impact].color }]} /> : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setTab('ameliorer')} style={styles.more}>
              <Text style={styles.moreText}>Voir comment corriger</Text>
              <ChevronDown size={16} color="#B371FF" style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
          </>
        ) : <Text style={styles.muted}>Rien d’important à corriger 👏</Text>}
      </Card>

      {locked ? (
        <TouchableOpacity activeOpacity={0.9} onPress={openPaywall}>
          <LinearGradient colors={[PINK, '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premium}>
            <Lock size={20} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>{gain ? `Ta vidéo peut passer ${gain}` : 'Débloque ton analyse complète'}</Text>
              <Text style={styles.premiumText}>
                {gain ? 'L’IA t’explique exactement quoi changer : ' : ''}corrections pas à pas, montage idéal, 3 nouvelles accroches, légende et hashtags prêts à copier.
              </Text>
              <Text style={styles.premiumFoot}>{trialFoot}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}
    </>
  );

  const videoTab = (
    <>
      {v.decoupage.length || v.resume ? (
        <Card title="Ce que l’IA a vu" icon={<Eye size={18} color="#4FC3FF" />} delay={40}>
          {v.resume ? <Text style={styles.resumeText}>{v.resume}</Text> : null}
          {v.decoupage.length ? <View style={{ marginTop: v.resume ? 14 : 0 }}><Breakdown items={v.decoupage} onSeek={canSeek ? seek : undefined} /></View> : null}
        </Card>
      ) : null}

      {v.retention ? (
        <Card title="Rétention estimée" icon={<TrendingDown size={18} color="#4FC3FF" />} delay={80}>
          <RetentionChart points={v.retention} moments={v.moments} duree={v.duree} showMoments={!locked} />
          {locked ? (
            <View style={{ marginTop: 14 }}><Locked
                onUnlock={openPaywall}
                lines={2}
                label="Voir où tu perds tes spectateurs"
                why={t?.moments_faibles ? `${plural(t.moments_faibles, 'moment précis', 'moments précis')} où les gens scrollent. Corrige-les et l’algorithme te pousse plus.` : 'Chaque seconde où les gens scrollent fait baisser ta portée.'}
              /></View>
          ) : v.moments.length ? (
            <View style={styles.moments}>
              {v.moments.map((m, i) => (
                <View key={i} style={styles.moment}>
                  <View style={[styles.momentDot, { backgroundColor: m.type === 'fort' ? '#42FFB0' : '#FF6B8A' }]} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.momentHead}>
                      <TimeChip t={fmtT(m.t)} onSeek={canSeek ? seek : undefined} />
                      <Text style={styles.momentTitle}>{m.titre}</Text>
                    </View>
                    <Text style={styles.momentDetail}>{m.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}

      {v.checklist.length ? (
        <Card title="Les codes TikTok" icon={<ListChecks size={18} color="#42FFB0" />}
          right={<Text style={styles.checkCount}>{v.checklist.filter((c) => c.ok).length}/{v.checklist.length}</Text>} delay={120}>
          {v.checklist.map((c, i) => (
            <View key={i} style={styles.check}>
              {c.ok ? <CheckCircle2 size={18} color="#42FFB0" /> : <XCircle size={18} color="#FF6B8A" />}
              <View style={{ flex: 1 }}>
                <Text style={styles.checkPoint}>{c.point}</Text>
                {c.detail ? <Text style={styles.checkDetail}>{c.detail}</Text> : null}
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {v.emotions ? (
        <Card title="Ce que vont ressentir tes spectateurs" icon={<Smile size={18} color="#FFD84F" />} delay={160}>
          {v.emotionDominante ? (
            <View style={styles.dominant}><Text style={styles.dominantText}>Émotion principale : <Text style={{ color: '#FFF' }}>{v.emotionDominante}</Text></Text></View>
          ) : null}
          {EMOTIONS.map((e, i) => (
            <View key={e.key} style={styles.emo}>
              <Text style={styles.emoEmoji}>{e.emoji}</Text>
              <Text style={styles.emoLabel}>{e.label}</Text>
              <View style={styles.emoTrack}>
                <MotiView from={{ width: '0%' }} animate={{ width: `${Math.max(2, v.emotions![e.key])}%` }} transition={{ type: 'timing', duration: 800, delay: 200 + i * 80 }} style={[styles.emoFill, { backgroundColor: e.color }]} />
              </View>
              <Text style={styles.emoValue}>{v.emotions![e.key]}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {!locked && v.publicCible ? (
        <Card title="Ton public idéal" icon={<Users size={18} color="#B371FF" />} delay={200}>
          <Text style={styles.publicTarget}>{v.publicCible.cible}</Text>
          {v.publicCible.pourquoi ? <Text style={styles.muted}>{v.publicCible.pourquoi}</Text> : null}
        </Card>
      ) : null}
    </>
  );

  const improveTab = locked ? (
    <LockedTab
      title={gain ? `Ta vidéo peut passer ${gain}` : 'Tout pour corriger ta vidéo'}
      why="Les 3 premières secondes décident si TikTok montre ta vidéo à plus de monde. Voici exactement quoi changer."
      onUnlock={openPaywall}
      foot={trialFoot}
      items={[
        t?.corrections ? `${plural(t.corrections, 'correction', 'corrections')} expliquée${t.corrections > 1 ? 's' : ''} pas à pas` : 'Chaque correction expliquée pas à pas',
        t?.plans_montage ? `Ton montage idéal en ${t.plans_montage} plans, avec tes propres passages` : 'Le montage idéal, plan par plan',
        t?.accroches ? `${plural(t.accroches, 'nouvelle accroche', 'nouvelles accroches')} à tester` : 'De nouvelles accroches à tester',
        'Les moments clés, avec saut direct dans la vidéo',
      ]}
    />
  ) : (
    <>
      {v.montage.length ? (
        <Card title="Ton montage idéal" icon={<Film size={18} color="#4FC3FF" />} delay={40}>
          <Text style={styles.cardIntro}>L’ordre conseillé pour ta prochaine version, avec tes propres passages.</Text>
          {v.montage.map((m, i) => (
            <View key={i} style={styles.edit}>
              <View style={styles.editRail}>
                <View style={styles.editNum}><Text style={styles.editNumText}>{i + 1}</Text></View>
                {i < v.montage.length - 1 ? <View style={styles.segLine} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: 14 }}>
                <TimeChip t={`${fmtT(m.debut)}`} onSeek={canSeek ? seek : undefined} />
                <Text style={styles.editAction}>{m.action}</Text>
                {m.texte_ecran ? <View style={styles.editText}><Text style={styles.editTextLabel}>Texte à l’écran</Text><Text style={styles.editTextValue}>{m.texte_ecran}</Text></View> : null}
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <Card title="Corrections pas à pas" icon={<Wrench size={18} color={PINK} />}
        right={v.corrections.length ? <Text style={styles.checkCount}>{doneCount}/{v.corrections.length}</Text> : null} delay={80}>
        {v.corrections.length ? v.corrections.map((c, i) => (
          <View key={i} style={[styles.fix, i > 0 && styles.divider, done[i] && { opacity: 0.55 }]}>
            <View style={styles.fixHead}>
              <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setDone((d) => ({ ...d, [i]: !d[i] })); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {done[i] ? <CheckSquare size={20} color="#42FFB0" /> : <Square size={20} color="rgba(255,255,255,0.45)" />}
              </TouchableOpacity>
              {c.moment ? <TimeChip t={c.moment} onSeek={canSeek ? seek : undefined} /> : null}
              {c.impact ? <View style={[styles.impact, { backgroundColor: `${IMPACT[c.impact].color}22` }]}><Text style={[styles.impactText, { color: IMPACT[c.impact].color }]}>{IMPACT[c.impact].label}</Text></View> : null}
            </View>
            <Text style={[styles.fixProblem, done[i] && { textDecorationLine: 'line-through' }]}>{c.probleme}</Text>
            <Text style={styles.fixSolution}>{c.solution}</Text>
            {c.comment ? (
              <View style={styles.how}>
                <Text style={styles.howLabel}>Comment faire</Text>
                <Text style={styles.howText}>{c.comment}</Text>
              </View>
            ) : null}
          </View>
        )) : <Text style={styles.muted}>Rien d’important à corriger 👏</Text>}
      </Card>

      {v.accroches.length ? (
        <Card title="3 accroches à tester" icon={<Megaphone size={18} color={PINK} />} delay={120}>
          {v.accroches.map((h, i) => (
            <TouchableOpacity key={i} activeOpacity={0.85} onPress={() => copy(h.texte_ecran || h.phrase, 'Accroche copiée')} style={[styles.hook, i > 0 && { marginTop: 10 }]}>
              <View style={styles.hookHead}>
                <Text style={styles.hookNum}>{i + 1}</Text>
                <Text style={styles.hookScreen}>{h.texte_ecran}</Text>
                <Copy size={14} color="rgba(255,255,255,0.5)" />
              </View>
              {h.phrase ? <Text style={styles.hookPhrase}>« {h.phrase} »</Text> : null}
              {h.pourquoi ? <Text style={styles.hookWhy}>{h.pourquoi}</Text> : null}
            </TouchableOpacity>
          ))}
        </Card>
      ) : null}

      {v.forts.length || v.faibles.length ? (
        <Card title="En résumé" icon={<ThumbsUp size={18} color="#42FFB0" />} delay={160}>
          {v.forts.map((f, i) => <Text key={`f${i}`} style={styles.bullet}>✅ {f}</Text>)}
          {v.faibles.map((f, i) => <Text key={`w${i}`} style={styles.bullet}>⚠️ {f}</Text>)}
        </Card>
      ) : null}

      {v.idees.length ? (
        <Card title="Idées pour ta prochaine vidéo" icon={<Lightbulb size={18} color="#FFD84F" />} delay={200}>
          {v.idees.map((idee, i) => <Text key={i} style={styles.bullet}>💡 {idee}</Text>)}
        </Card>
      ) : null}

      <TouchableOpacity activeOpacity={0.9} onPress={recheck}>
        <View style={styles.recheck}>
          <View style={styles.recheckIcon}><RefreshCw size={20} color="#FFF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recheckTitle}>J’ai corrigé : revérifier</Text>
            <Text style={styles.recheckText}>Envoie ta nouvelle version et compare la note.</Text>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );

  const publishTab = locked ? (
    <LockedTab
      title="Publie au bon moment, avec les bons mots"
      why="Une bonne vidéo mal publiée passe inaperçue : la légende, les hashtags et l’heure comptent pour toucher le bon public dès les premières heures."
      onUnlock={openPaywall}
      cta="Débloquer ma publication parfaite"
      foot={trialFoot}
      items={[
        'Ta légende prête à copier',
        t?.hashtags ? `${t.hashtags} hashtags choisis pour CETTE vidéo` : 'Les hashtags qui collent à ta vidéo',
        'Tes meilleurs horaires de publication',
        'Le son et le format tendance à utiliser',
      ]}
    />
  ) : (
    <>
      <Card title="Prêt à publier" icon={<Copy size={18} color="#42FFB0" />} delay={40}>
        {v.legende ? <View style={styles.caption}><Text style={styles.captionText}>{v.legende}</Text></View> : null}
        {v.hashtags.length ? (
          <View style={styles.tags}>
            {v.hashtags.map((h) => (
              <TouchableOpacity key={h} onPress={() => copy(`#${h}`, 'Hashtag copié')} style={styles.tag}><Text style={styles.tagText}>#{h}</Text></TouchableOpacity>
            ))}
          </View>
        ) : null}
        <TouchableOpacity activeOpacity={0.9} onPress={() => copy([v.legende, v.hashtags.map((h) => `#${h}`).join(' ')].filter(Boolean).join('\n\n'), 'Légende copiée')} style={styles.copyBtn}>
          <Copy size={15} color="#FFF" />
          <Text style={styles.copyText}>Copier la légende + hashtags</Text>
        </TouchableOpacity>
        {v.horaires.length ? (
          <View style={styles.hours}>
            <Clock size={15} color="#FFD84F" />
            <Text style={styles.hoursLabel}>Meilleurs horaires :</Text>
            {v.horaires.map((h) => <View key={h} style={styles.hour}><Text style={styles.hourText}>{h.replace(':', 'h')}</Text></View>)}
          </View>
        ) : null}
      </Card>

      {v.tendances ? (
        <Card title="Ta vidéo et les tendances" icon={<Flame size={18} color="#FFB84F" />} delay={80}>
          <View style={[styles.trendBadge, { backgroundColor: v.tendances.dans_la_tendance ? 'rgba(66,255,176,0.14)' : 'rgba(255,184,79,0.14)' }]}>
            <Text style={[styles.trendBadgeText, { color: v.tendances.dans_la_tendance ? '#42FFB0' : '#FFB84F' }]}>
              {v.tendances.dans_la_tendance ? '🔥 Dans la tendance' : '🕰️ Pas encore dans la tendance'}
            </Text>
          </View>
          {v.tendances.explication ? <Text style={styles.trendText}>{v.tendances.explication}</Text> : null}
          {v.tendances.son_conseille ? (
            <TouchableOpacity activeOpacity={0.85} disabled={!v.tendances.son_url} onPress={() => Linking.openURL(v.tendances!.son_url).catch(() => {})} style={styles.trendRow}>
              <View style={[styles.trendIcon, { backgroundColor: 'rgba(255,216,79,0.15)' }]}><Music size={16} color="#FFD84F" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trendRowLabel}>Son tendance conseillé</Text>
                <Text style={styles.trendRowValue} numberOfLines={1}>{v.tendances.son_conseille}</Text>
              </View>
              {v.tendances.son_url ? <ExternalLink size={16} color="rgba(255,255,255,0.5)" /> : null}
            </TouchableOpacity>
          ) : null}
          {v.tendances.format_conseille ? (
            <View style={styles.trendRow}>
              <View style={[styles.trendIcon, { backgroundColor: 'rgba(79,195,255,0.15)' }]}><Video size={16} color="#4FC3FF" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trendRowLabel}>Format qui marche en ce moment</Text>
                <Text style={styles.trendRowValue}>{v.tendances.format_conseille}</Text>
              </View>
            </View>
          ) : null}
          {v.tendances.hashtags_du_moment.length ? (
            <View style={styles.tags}>
              {v.tendances.hashtags_du_moment.map((h) => (
                <TouchableOpacity key={h} onPress={() => copy(`#${h}`, 'Hashtag copié')} style={[styles.tag, { borderColor: 'rgba(255,184,79,0.45)', backgroundColor: 'rgba(255,184,79,0.12)' }]}>
                  <Text style={styles.tagText}>🔥 #{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}

      <TrendingSoundsSuggestion onSeeAll={() => navigation.navigate('Main', { screen: 'Trends' })} />

      {v.risque ? (
        <View style={styles.risk}>
          <ShieldCheck size={16} color={v.risque.niveau === 'Faible' ? '#42FFB0' : v.risque.niveau === 'Moyen' ? '#FFD84F' : '#FF6B8A'} />
          <Text style={styles.riskText}><Text style={{ fontWeight: '800', color: '#FFF' }}>Risque {v.risque.niveau.toLowerCase()} · </Text>{v.risque.detail}</Text>
        </View>
      ) : null}
    </>
  );

  const content = { resume, video: videoTab, ameliorer: improveTab, publier: publishTab }[tab];

  return (
    <View style={styles.root}>
      {/* Fond : ta vidéo floutée */}
      {videoUri ? <ExpoVideo source={{ uri: videoUri }} style={styles.bgVideo} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted /> : null}
      <BlurView intensity={70} tint="dark" style={styles.bgVideo} />
      <LinearGradient colors={['rgba(10,2,20,0.3)', 'rgba(10,2,20,0.75)', '#0A0214']} locations={[0, 0.55, 1]} style={styles.bgVideo} />

      <ScrollView ref={scrollRef} stickyHeaderIndices={[1]} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* 0 · En-tête */}
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronLeft size={24} color="#FFF" />
            </TouchableOpacity>
            {v.type_video ? <View style={styles.typeChip}><Text style={styles.typeText}>{v.type_video}</Text></View> : null}
          </View>

          <View style={styles.heroRow}>
            <TouchableOpacity activeOpacity={0.95} onPress={togglePlay} style={[styles.player, { width: videoW, height: videoW * 16 / 9 }]}>
              {videoUri ? (
                <ExpoVideo
                  ref={videoRef}
                  source={{ uri: videoUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted={muted}
                  progressUpdateIntervalMillis={250}
                  onPlaybackStatusUpdate={(st: any) => {
                    if (!st?.isLoaded) return;
                    setPos((st.positionMillis ?? 0) / 1000);
                    if (st.durationMillis) setDur(st.durationMillis / 1000);
                  }}
                />
              ) : null}
              {!playing ? <View style={styles.playOverlay}><Play size={30} color="#FFF" fill="#FFF" /></View> : null}
              <TouchableOpacity onPress={() => setMuted((m) => !m)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.muteBtn}>
                {muted ? <VolumeX size={15} color="#FFF" /> : <Volume2 size={15} color="#FFF" />}
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 14 }} style={[styles.ring, { borderColor: sc, shadowColor: sc }]}>
                <Text style={styles.ringValue}>{v.score}</Text>
                <Text style={styles.ringMax}>/100</Text>
              </MotiView>
              <Text style={styles.verdict}>{v.verdict}</Text>
              <View style={[styles.ready, { backgroundColor: v.pret ? 'rgba(66,255,176,0.15)' : 'rgba(255,216,79,0.15)' }]}>
                {v.pret ? <CheckCircle2 size={13} color="#42FFB0" /> : <Wrench size={13} color="#FFD84F" />}
                <Text style={[styles.readyText, { color: v.pret ? '#42FFB0' : '#FFD84F' }]}>
                  {v.pret ? 'Prête à publier' : fixesCount ? `${fixesCount} correction${fixesCount > 1 ? 's' : ''}` : 'Quelques réglages'}
                </Text>
              </View>
              {v.potentiel ? <Text style={styles.heroPotential}>Jusqu’à <Text style={{ color: scoreColor(v.potentiel), fontWeight: '900' }}>{v.potentiel}</Text> une fois corrigée</Text> : null}
            </View>
          </View>

          {/* Barre de lecture + repères */}
          {videoUri ? (
            <View style={styles.scrub}>
              <View style={styles.scrubTrack}>
                <View style={[styles.scrubFill, { width: `${Math.min(100, (pos / total) * 100)}%` }]} />
                {markers.map((m, i) => (
                  <TouchableOpacity key={i} onPress={() => seek(m.t)} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    style={[styles.marker, { left: `${Math.min(98, (m.t / total) * 100)}%`, backgroundColor: m.color }]} />
                ))}
              </View>
              <View style={styles.scrubRow}>
                <Text style={styles.scrubTime}>{fmtT(pos)}</Text>
                <Text style={styles.scrubHint}>{markers.length ? 'Touche un repère pour voir le moment' : ''}</Text>
                <Text style={styles.scrubTime}>{fmtT(total)}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* 1 · Onglets (restent en haut) */}
        <View style={[styles.tabsWrap, { paddingTop: 8 }]}>
          <View style={styles.tabs}>
            {TABS.map((t) => {
              const on = tab === t.key;
              return (
                <TouchableOpacity key={t.key} activeOpacity={0.85} onPress={() => { Haptics.selectionAsync(); setTab(t.key); }} style={[styles.tab, on && styles.tabOn]}>
                  {on ? <LinearGradient colors={[PINK, '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /> : null}
                  {t.premium && locked ? <Lock size={11} color={on ? '#FFF' : 'rgba(234,226,247,0.6)'} /> : null}
                  <Text style={[styles.tabText, on && { color: '#FFF' }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2 · Contenu */}
        <MotiView key={tab} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 250 }} style={styles.body}>
          {content}
          <TouchableOpacity activeOpacity={0.9} onPress={async () => { if (!(await gate())) return; const video = await pickVideo(); if (video) navigation.replace('VideoAnalyzing', { videoUri: video.uri }); }} style={{ marginTop: 8 }}>
            <View style={styles.secondaryCta}>
              <Sparkles size={16} color="#FFF" />
              <Text style={styles.secondaryCtaText}>Analyser une autre vidéo</Text>
            </View>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>

      {/* Masque sous la barre d'état (le contenu ne passe plus sous l'heure) */}
      <LinearGradient pointerEvents="none" colors={['#0A0214', 'rgba(10,2,20,0)']} style={[styles.statusMask, { height: insets.top + 6 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bgVideo: { position: 'absolute', top: 0, left: 0, right: 0, height: 620 },
  player: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#1B0730', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  muteBtn: { position: 'absolute', right: 8, bottom: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(10,2,20,0.6)', alignItems: 'center', justifyContent: 'center' },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,2,20,0.35)' },
  heroPotential: { color: 'rgba(234,226,247,0.75)', fontSize: 12, marginTop: 8 },
  scrub: { marginTop: 18 },
  scrubTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center' },
  scrubFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3, backgroundColor: '#FFF' },
  marker: { position: 'absolute', width: 14, height: 14, borderRadius: 7, marginLeft: -7, borderWidth: 2, borderColor: '#0A0214' },
  scrubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  scrubTime: { color: 'rgba(234,226,247,0.7)', fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  scrubHint: { color: 'rgba(234,226,247,0.5)', fontSize: 11, flex: 1, textAlign: 'center' },

  tabsWrap: { paddingHorizontal: 22, paddingBottom: 10, backgroundColor: '#0A0214' },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(179,113,255,0.25)' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 999, overflow: 'hidden' },
  tabOn: {},
  tabText: { color: 'rgba(234,226,247,0.7)', fontSize: 13, fontWeight: '800' },
  statusMask: { position: 'absolute', top: 0, left: 0, right: 0 },

  rings: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  ringItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
  ringItemValue: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  ringItemLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  ringItemLabel: { color: 'rgba(234,226,247,0.8)', fontSize: 10, fontWeight: '800' },
  pillarDetail: { marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)' },
  pillarDetailTitle: { fontSize: 14, fontWeight: '900', marginBottom: 6 },
  ringsHint: { color: 'rgba(234,226,247,0.45)', fontSize: 11, textAlign: 'center', marginTop: 10 },

  potential: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, backgroundColor: CARD_BG, borderWidth: 1.4, borderColor: 'rgba(66,255,176,0.35)' },
  potentialScores: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  potentialNow: { fontSize: 24, fontWeight: '900' },
  potentialArrow: { color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: '800' },
  potentialNext: { fontSize: 30, fontWeight: '900' },
  potentialTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  potentialText: { color: 'rgba(234,226,247,0.6)', fontSize: 12, marginTop: 2 },

  quickFix: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  quickFixText: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  impactDot: { width: 8, height: 8, borderRadius: 4 },
  segTimeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardIntro: { color: 'rgba(234,226,247,0.65)', fontSize: 13, lineHeight: 18, marginTop: -6, marginBottom: 14 },
  edit: { flexDirection: 'row', gap: 12 },
  editRail: { alignItems: 'center', width: 24 },
  editNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(79,195,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  editNumText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  editAction: { color: '#FFF', fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 6 },
  editText: { marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,79,249,0.1)', borderWidth: 1, borderColor: 'rgba(255,79,249,0.3)' },
  editTextLabel: { color: PINK, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  editTextValue: { color: '#FFF', fontSize: 14, fontWeight: '800', marginTop: 2 },
  recheck: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, backgroundColor: 'rgba(79,195,255,0.12)', borderWidth: 1.4, borderColor: 'rgba(79,195,255,0.45)' },
  recheckIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(79,195,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  recheckTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  recheckText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  lockedTab: { alignItems: 'center', padding: 22, borderRadius: 24, backgroundColor: CARD_BG, borderWidth: 1, borderColor: 'rgba(255,79,249,0.4)' },
  lockedTabIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(144,19,254,0.8)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  lockedTabTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 14, textAlign: 'center' },
  lockedTabRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', paddingVertical: 6 },
  lockedTabText: { color: 'rgba(234,226,247,0.9)', fontSize: 14, fontWeight: '600', flex: 1 },
  secondaryCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(179,113,255,0.35)' },
  secondaryCtaText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  root: { flex: 1, backgroundColor: '#0A0214' },

  hero: { paddingHorizontal: 22, paddingBottom: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(10,2,20,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(10,2,20,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  typeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  thumb: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#1B0730', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)' },
  ring: {
    width: 112, height: 112, borderRadius: 56, borderWidth: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,2,20,0.55)',
    shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
  },
  ringValue: { color: '#FFF', fontSize: 40, fontWeight: '900', lineHeight: 44 },
  ringMax: { color: 'rgba(234,226,247,0.6)', fontSize: 12, fontWeight: '700' },
  verdict: { color: '#FFF', fontSize: 17, fontWeight: '900', lineHeight: 22, marginTop: 14 },
  ready: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginTop: 10 },
  readyText: { fontSize: 12, fontWeight: '800' },

  body: { paddingHorizontal: 22, gap: 14, paddingTop: 4, backgroundColor: '#0A0214' },
  card: { padding: 18, borderRadius: 24, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', flex: 1 },
  muted: { color: 'rgba(234,226,247,0.6)', fontSize: 14 },

  coachLabel: { color: '#B371FF', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  coachText: { color: '#FFF', fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 8 },
  resumeToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, alignSelf: 'flex-start' },
  resumeToggleText: { color: '#B371FF', fontSize: 13, fontWeight: '800' },
  resumeText: { color: 'rgba(234,226,247,0.75)', fontSize: 14, lineHeight: 20, marginTop: 8 },

  priority: { padding: 18, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255,79,249,0.55)' },
  priorityTitle: { color: '#FFF', fontSize: 19, fontWeight: '900', lineHeight: 25, marginTop: -4 },
  priorityWhy: { color: 'rgba(234,226,247,0.8)', fontSize: 14, lineHeight: 20, marginTop: 8 },
  priorityAction: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: 'rgba(10,2,20,0.45)' },
  priorityActionText: { color: '#FFF', fontSize: 14, fontWeight: '700', lineHeight: 20 },

  pillar: { marginBottom: 14 },
  pillarHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  pillarIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pillarLabel: { color: '#FFF', fontSize: 15, fontWeight: '700', flex: 1 },
  pillarNote: { fontSize: 16, fontWeight: '900' },
  pillarTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  pillarFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  pillarComment: { color: 'rgba(234,226,247,0.65)', fontSize: 13, lineHeight: 18, marginTop: 7 },

  pillarAdvice: { color: '#FFF', fontSize: 13, lineHeight: 18, marginTop: 5, fontWeight: '600' },

  seg: { flexDirection: 'row', gap: 12 },
  segRail: { alignItems: 'center', width: 12 },
  segDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  segLine: { flex: 1, width: 2, backgroundColor: 'rgba(179,113,255,0.25)', marginTop: 4 },
  segHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  segTime: { color: '#4FC3FF', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  segRole: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  segRoleText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  segText: { color: 'rgba(234,226,247,0.85)', fontSize: 14, lineHeight: 20, marginTop: 5 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  moreText: { color: '#B371FF', fontSize: 13, fontWeight: '800' },

  checkCount: { color: '#42FFB0', fontSize: 15, fontWeight: '900' },
  check: { flexDirection: 'row', gap: 12, paddingVertical: 8, alignItems: 'flex-start' },
  checkPoint: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  checkDetail: { color: 'rgba(234,226,247,0.65)', fontSize: 13, lineHeight: 18, marginTop: 2 },

  dominant: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,216,79,0.12)', marginBottom: 14 },
  dominantText: { color: '#FFD84F', fontSize: 13, fontWeight: '800' },
  emo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  emoEmoji: { fontSize: 17, width: 24 },
  emoLabel: { color: '#FFF', fontSize: 14, fontWeight: '700', width: 82 },
  emoTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  emoFill: { height: '100%', borderRadius: 4 },
  emoValue: { color: '#FFF', fontSize: 13, fontWeight: '800', width: 28, textAlign: 'right' },

  impact: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  impactText: { fontSize: 11, fontWeight: '800' },
  how: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(79,195,255,0.08)', borderWidth: 1, borderColor: 'rgba(79,195,255,0.2)' },
  howLabel: { color: '#4FC3FF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  howText: { color: 'rgba(234,226,247,0.9)', fontSize: 13, lineHeight: 19, marginTop: 4 },

  hook: { padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,79,249,0.07)', borderWidth: 1, borderColor: 'rgba(255,79,249,0.3)' },
  hookHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hookNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: PINK, color: '#FFF', fontSize: 12, fontWeight: '900', textAlign: 'center', lineHeight: 22, overflow: 'hidden' },
  hookScreen: { color: '#FFF', fontSize: 16, fontWeight: '900', flex: 1 },
  hookPhrase: { color: 'rgba(234,226,247,0.9)', fontSize: 14, fontStyle: 'italic', lineHeight: 20, marginTop: 8 },
  hookWhy: { color: 'rgba(234,226,247,0.6)', fontSize: 12, lineHeight: 17, marginTop: 6 },

  trendBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  trendBadgeText: { fontSize: 13, fontWeight: '800' },
  trendText: { color: 'rgba(234,226,247,0.85)', fontSize: 14, lineHeight: 20, marginTop: 10 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)' },
  trendIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  trendRowLabel: { color: 'rgba(234,226,247,0.55)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  trendRowValue: { color: '#FFF', fontSize: 14, fontWeight: '700', marginTop: 2, lineHeight: 19 },
  publicTarget: { color: '#FFF', fontSize: 17, fontWeight: '900', marginBottom: 4 },

  chartNote: { color: 'rgba(234,226,247,0.6)', fontSize: 12, marginTop: 6 },
  moments: { marginTop: 14, gap: 12 },
  moment: { flexDirection: 'row', gap: 12 },
  momentDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  momentHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  momentTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', flexShrink: 1 },
  momentDetail: { color: 'rgba(234,226,247,0.7)', fontSize: 13, lineHeight: 18, marginTop: 4 },
  timeChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(79,195,255,0.15)' },
  timeText: { color: '#4FC3FF', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },

  premium: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 24 },
  premiumTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  premiumText: { color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 18, marginTop: 3 },

  fix: { paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: 'rgba(179,113,255,0.15)' },
  fixHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  fixNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,79,249,0.3)', alignItems: 'center', justifyContent: 'center' },
  fixNumText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  fixProblem: { color: '#FFF', fontSize: 15, fontWeight: '800', lineHeight: 21 },
  fixSolution: { color: 'rgba(234,226,247,0.8)', fontSize: 14, lineHeight: 20, marginTop: 4 },

  twoCols: { gap: 14 },
  bullet: { color: 'rgba(234,226,247,0.85)', fontSize: 14, lineHeight: 21, marginBottom: 6 },

  caption: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  captionText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(66,255,176,0.12)', borderWidth: 1, borderColor: 'rgba(66,255,176,0.35)' },
  tagText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(66,255,176,0.18)' },
  copyText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  hours: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  hoursLabel: { color: 'rgba(234,226,247,0.75)', fontSize: 13, fontWeight: '700' },
  hour: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,216,79,0.14)' },
  hourText: { color: '#FFD84F', fontSize: 13, fontWeight: '800' },

  engRow: { flexDirection: 'row', gap: 10 },
  eng: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)' },
  engValue: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  engLabel: { color: 'rgba(234,226,247,0.6)', fontSize: 11, fontWeight: '700' },
  risk: { flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'flex-start' },
  riskText: { flex: 1, color: 'rgba(234,226,247,0.75)', fontSize: 13, lineHeight: 18 },

  locked: { borderRadius: 16, overflow: 'hidden', padding: 14, backgroundColor: 'rgba(255,255,255,0.03)' },
  ghost: { height: 11, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)' },
  lockedOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13,0,23,0.25)' },
  lockPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(144,19,254,0.8)' },
  lockText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  lockWhy: { color: '#FFF', fontSize: 13.5, fontWeight: '700', textAlign: 'center', paddingHorizontal: 16, marginBottom: 10, lineHeight: 18 },
  teaseLead: { color: 'rgba(234,226,247,0.85)', fontSize: 14.5, lineHeight: 20, marginBottom: 12 },
  teaseStrong: { color: '#FF6B8A', fontWeight: '900' },
  teaseFix: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  teaseHidden: { color: '#B371FF', fontSize: 12.5, fontWeight: '700', marginTop: 4 },
  premiumFoot: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', marginTop: 6 },
  lockedTabWhy: { color: 'rgba(234,226,247,0.75)', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 6 },
  lockedTabFoot: { color: 'rgba(234,226,247,0.55)', fontSize: 12.5, textAlign: 'center', marginTop: 10 },

  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 999 },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

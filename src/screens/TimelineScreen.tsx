import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Upload, Flame, Wand2, ChevronRight, Plus, CalendarDays, Target, Sprout, Mountain, TrendingDown, Music2, Play } from 'lucide-react-native';

import { OnboardingBackground } from '../components/onboarding/OnboardingUI';
import AnalyzeHero from '../components/home/AnalyzeHero';
import AccountCard from '../components/home/AccountCard';
import { useRevenueCat } from '../context/RevenueCatContext';
import { renameAiPublishTasks } from '../services/calendarService';
import TaskList from './Calendar/TaskList';
import AddTaskModal from './Calendar/AddTaskModal';
import { getTasksByDate, CalendarTask, getTasks } from '../services/calendarService';
import { useAuth } from '../hooks/useAuth';
import { toLocalDateString } from '../utils/date';
import { pickVideo } from '../utils/pickVideo';
import { useCreatorProfile, firstName, NICHE_LABELS, POSTS_PER_WEEK } from '../services/creatorProfile';
import { useAnalysisHistory, historyStats } from '../services/analysisHistory';
import { apiService, resolveApiUrl } from '../services/api';
import { useAnalysisGate } from '../hooks/useAnalysisGate';

const PINK = '#FF4FF9';
const VIOLET = '#B371FF';
const CARD_BG = '#1B0730';
const CARD_BORDER = 'rgba(179, 113, 255, 0.3)';

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const STAGES = {
  emerging: { label: 'Émergente', color: '#42FFB0', Icon: Sprout },
  peak: { label: 'Au sommet', color: '#FFD84F', Icon: Mountain },
  declining: { label: 'En déclin', color: '#A1A1AA', Icon: TrendingDown },
} as const;

const scoreColor = (s: number) => (s >= 80 ? '#42FFB0' : s >= 60 ? '#4FC3FF' : s >= 40 ? '#FFB85C' : '#FF6B8A');
const relativeDay = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Aujourd’hui';
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

/** La tendance à ne pas rater cette semaine dans la niche du créateur. */
const useTrendOfWeek = (niche?: string) => {
  const [trend, setTrend] = useState<any>(null);
  useEffect(() => {
    let alive = true;
    apiService.getTrends(niche).then((res) => {
      if (!alive || !res.success) return;
      const d = (res.data as any)?.data;
      if (!d) return;
      const sound = (d.sounds ?? []).find((s: any) => s.stage === 'emerging') ?? d.sounds?.[0];
      const video = d.videos?.[0];
      if (sound) setTrend({ kind: 'sound', item: sound });
      else if (video) setTrend({ kind: 'video', item: video });
    }).catch(() => {});
    return () => { alive = false; };
  }, [niche]);
  return trend;
};

export default function TimelineScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const gate = useAnalysisGate(navigation);
  const { profile } = useCreatorProfile();
  const history = useAnalysisHistory();
  const { isPremium } = useRevenueCat();
  const stats = historyStats(history);
  const name = firstName(profile);
  const niche = profile?.niches?.[0];
  const trend = useTrendOfWeek(niche);

  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateString());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [allTasks, setAllTasks] = useState<CalendarTask[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const loadAllTasks = async () => {
    try {
      const all = await getTasks(user?.uid || null);
      setAllTasks(all);
      // Publications prévues par l'IA avec une ancienne niche : on les remet à jour
      const label = niche ? NICHE_LABELS[niche] : null;
      if (label && all.some((t) => t.createdBy === 'ai' && t.type === 'publish' && t.title.startsWith('Publier une vidéo') && t.title !== `Publier une vidéo ${label}`)) {
        const n = await renameAiPublishTasks(niche, user?.uid ?? null).catch(() => 0);
        if (n) setAllTasks(await getTasks(user?.uid || null));
      }
    } catch { setAllTasks([]); }
  };
  const loadTasks = async () => {
    try { setTasks(await getTasksByDate(selectedDate, user?.uid || null)); } catch { setTasks([]); }
  };

  useFocusEffect(useCallback(() => { loadAllTasks(); loadTasks(); }, [user?.uid, selectedDate, niche])); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!(await gate())) return;
    const video = await pickVideo();
    if (video) navigation.navigate('VideoAnalyzing', { videoUri: video.uri });
  };

  const handleTaskAdded = () => { setModalVisible(false); loadTasks(); loadAllTasks(); };

  // Semaine en cours, du lundi au dimanche
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  const todayStr = toLocalDateString();

  const nextPost = allTasks.find((t) => t.date >= todayStr && t.type === 'publish') ?? allTasks.find((t) => t.date >= todayStr) ?? null;

  // Objectif : nombre de vidéos par semaine choisi dans le questionnaire
  const target = POSTS_PER_WEEK[profile?.frequency ?? ''] ?? 3;
  const done = Math.min(stats.thisWeek, target);
  const goalReached = stats.thisWeek >= target;

  const dateLabel = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const initials = (name || 'V').slice(0, 1).toUpperCase();

  const openTrend = () => {
    if (!trend) return;
    const it = trend.item;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('TrendPlan', {
      kind: trend.kind,
      id: it.id,
      title: trend.kind === 'sound' ? it.title : `@${it.author}`,
      subtitle: trend.kind === 'sound' ? it.artist : it.soundTitle,
      cover: it.cover,
      url: it.url,
      stage: it.stage,
      niche,
      level: profile?.level,
    });
  };

  const stage = trend?.item?.stage ? STAGES[trend.item.stage as keyof typeof STAGES] : null;
  const trendCover = resolveApiUrl(trend?.item?.cover ?? null);

  return (
    <View style={styles.root}>
      <OnboardingBackground />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>{name ? `Salut ${name} 👋` : 'Salut 👋'}</Text>
            <Text style={styles.date}>
              {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}{niche ? ` · ${NICHE_LABELS[niche] ?? niche}` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
            <LinearGradient colors={[PINK, '#9013FE']} style={styles.avatar}>
              {profile?.tiktokPreview?.avatar && profile.tiktokPreview.handle === profile.tiktok ? (
                <Image source={{ uri: profile.tiktokPreview.avatar }} style={{ width: '88%', height: '88%', borderRadius: 999 }} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Fonction phare : l'analyse vidéo */}
        <View style={{ marginBottom: 22 }}>
          <AnalyzeHero onPress={handleAnalyze} lastScore={history[0]?.score ?? null} potential={history[0]?.result?.score_potentiel ?? null} freeLeft={isPremium ? null : Math.max(0, 3 - history.filter((h) => h.date.slice(0, 10) === new Date().toISOString().slice(0, 10)).length)} />
        </View>

        {/* Bilan du compte TikTok */}
        <View style={{ marginBottom: 22 }}>
          <AccountCard profile={profile} onPress={() => navigation.navigate('AccountReport')} />
        </View>

        {/* Tendance de la semaine */}
        {trend ? (
          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionTitleRow}>
                <Flame size={18} color="#FFB84F" />
                <Text style={styles.section}>Ta tendance de la semaine</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Trends')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.seeAll}>Tout voir</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.92} onPress={openTrend}>
              <LinearGradient colors={['rgba(255,79,249,0.22)', 'rgba(144,19,254,0.16)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.trendCard}>
                <View style={styles.trendTop}>
                  {trendCover ? <Image source={{ uri: trendCover }} style={styles.trendCover} /> : (
                    <LinearGradient colors={['#7B33F7', PINK]} style={[styles.trendCover, { alignItems: 'center', justifyContent: 'center' }]}>
                      {trend.kind === 'sound' ? <Music2 size={26} color="#FFF" /> : <Play size={26} color="#FFF" />}
                    </LinearGradient>
                  )}
                  <View style={{ flex: 1 }}>
                    {stage ? (
                      <View style={[styles.stage, { backgroundColor: `${stage.color}22` }]}>
                        <stage.Icon size={11} color={stage.color} />
                        <Text style={[styles.stageText, { color: stage.color }]}>{stage.label}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.trendTitle} numberOfLines={2}>
                      {trend.kind === 'sound' ? trend.item.title : `@${trend.item.author}`}
                    </Text>
                    <Text style={styles.trendSub} numberOfLines={1}>
                      {trend.kind === 'sound' ? (trend.item.artist || 'Son tendance') : (trend.item.soundTitle || 'Vidéo tendance')}
                    </Text>
                  </View>
                </View>
                <View style={styles.trendCta}>
                  <Wand2 size={16} color="#FFF" />
                  <Text style={styles.trendCtaText}>Refaire à ma façon</Text>
                  <ChevronRight size={16} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        ) : null}

        {/* Ta semaine */}
        <View style={styles.sectionRow}>
          <Text style={styles.section}>Ta semaine</Text>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModalVisible(true); }} style={styles.addBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Plus size={15} color="#FFF" strokeWidth={2.6} />
            <Text style={styles.addBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.week}>
          {weekDays.map((d) => {
            const ds = toLocalDateString(d);
            const selected = ds === selectedDate;
            const isToday = ds === todayStr;
            const hasTask = allTasks.some((t) => t.date === ds);
            return (
              <TouchableOpacity key={ds} style={styles.day} activeOpacity={0.7} onPress={() => { Haptics.selectionAsync(); setSelectedDate(ds); }}>
                <Text style={[styles.dayLetter, isToday && { color: PINK }]}>{DAY_LETTERS[d.getDay()]}</Text>
                <View style={[styles.dayCircle, selected && styles.dayCircleOn]}>
                  {selected ? <LinearGradient colors={[PINK, '#9013FE']} style={StyleSheet.absoluteFill} /> : null}
                  <Text style={[styles.dayNum, selected && { color: '#FFF' }]}>{d.getDate()}</Text>
                </View>
                <View style={[styles.dayDot, { opacity: hasTask ? 1 : 0 }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {tasks.length > 0 ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.sectionSmall}>{selectedDate === todayStr ? 'Aujourd’hui' : 'Ce jour-là'}</Text>
            <TaskList tasks={tasks} onTaskDeleted={() => { loadTasks(); loadAllTasks(); }} />
          </View>
        ) : null}

        {/* Prochain post */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => (nextPost ? navigation.navigate('Calendar') : setModalVisible(true))} style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(79,195,255,0.15)' }]}>
            <CalendarDays size={20} color="#4FC3FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>Prochain post</Text>
            {nextPost ? (
              <>
                <Text style={styles.cardTitle} numberOfLines={1}>{nextPost.title}</Text>
                <Text style={styles.cardSub}>
                  {new Date(nextPost.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })} · {nextPost.hour}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Rien de prévu</Text>
                <Text style={styles.cardSub}>Planifie ton prochain post pour garder le rythme</Text>
              </>
            )}
          </View>
          <ChevronRight size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        {/* Objectif de la semaine */}
        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,216,79,0.15)' }]}>
            <Target size={20} color="#FFD84F" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.goalHead}>
              <Text style={styles.cardLabel}>Objectif de la semaine</Text>
              <Text style={styles.goalCount}>{done}/{target}</Text>
            </View>
            <Text style={styles.cardTitle}>
              {goalReached ? 'Objectif atteint, bravo 🎉' : `Analyse ${target} vidéo${target > 1 ? 's' : ''} avant de publier`}
            </Text>
            <View style={styles.goalBar}>
              <LinearGradient colors={['#9013FE', PINK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.goalFill, { width: `${Math.max(4, (done / target) * 100)}%` }]} />
            </View>
          </View>
        </View>

        {/* Dernières analyses */}
        <Text style={[styles.section, { marginTop: 18, marginBottom: 12 }]}>Tes dernières analyses</Text>
        {history.length === 0 ? (
          <TouchableOpacity activeOpacity={0.88} onPress={handleAnalyze} style={styles.empty}>
            <Ionicons name="film-outline" size={34} color="rgba(255,255,255,0.4)" />
            <Text style={styles.emptyTitle}>Ta première analyse t’attend</Text>
            <Text style={styles.emptyText}>Choisis une vidéo : l’IA te donne sa note et quoi améliorer.</Text>
          </TouchableOpacity>
        ) : (
          history.slice(0, 3).map((h) => (
            <TouchableOpacity
              key={h.id}
              activeOpacity={h.result ? 0.85 : 1}
              disabled={!h.result}
              onPress={() => navigation.navigate('AnalysisResult', { videoUri: h.videoUri, result: h.result })}
              style={styles.historyRow}
            >
              <View style={[styles.scoreBadge, { borderColor: scoreColor(h.score) }]}>
                <Text style={[styles.scoreText, { color: scoreColor(h.score) }]}>{h.score}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle} numberOfLines={1}>{h.title}</Text>
                <Text style={styles.historyDate}>{relativeDay(h.date)}</Text>
              </View>
              {h.result ? <ChevronRight size={18} color="rgba(255,255,255,0.5)" /> : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <AddTaskModal visible={modalVisible} onClose={() => setModalVisible(false)} onTaskAdded={handleTaskAdded} defaultDate={selectedDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0214' },
  scroll: { paddingHorizontal: 22, paddingBottom: 130 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  hello: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.3 },
  date: { color: 'rgba(234,226,247,0.65)', fontSize: 14, marginTop: 4 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 19, fontWeight: '900' },

  week: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 22 },
  day: { alignItems: 'center', gap: 6, flex: 1 },
  dayLetter: { color: 'rgba(234,226,247,0.55)', fontSize: 12, fontWeight: '700' },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dayCircleOn: {},
  dayNum: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '800' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: PINK },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  section: { color: '#FFF', fontSize: 19, fontWeight: '800' },
  sectionSmall: { color: 'rgba(234,226,247,0.65)', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  seeAll: { color: PINK, fontSize: 14, fontWeight: '800' },

  trendCard: { borderRadius: 24, padding: 16, borderWidth: 1.4, borderColor: 'rgba(255,79,249,0.45)', marginBottom: 14 },
  trendTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trendCover: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#2A0F45' },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 6 },
  stageText: { fontSize: 11, fontWeight: '800' },
  trendTitle: { color: '#FFF', fontSize: 17, fontWeight: '800', lineHeight: 22 },
  trendSub: { color: 'rgba(234,226,247,0.7)', fontSize: 13, marginTop: 2 },
  trendCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 12, borderRadius: 999, backgroundColor: 'rgba(10,2,20,0.45)' },
  trendCtaText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  actionMain: { borderRadius: 22, padding: 16, minHeight: 112, justifyContent: 'flex-end', gap: 4 },
  actionMainTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', marginTop: 10 },
  actionMainSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  actionSecondary: { borderRadius: 22, padding: 16, minHeight: 112, justifyContent: 'flex-end', gap: 4, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  actionSecondaryTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', marginTop: 10 },
  actionSecondarySub: { color: 'rgba(234,226,247,0.6)', fontSize: 12, fontWeight: '600' },

  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { color: 'rgba(234,226,247,0.6)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 3 },
  cardSub: { color: 'rgba(234,226,247,0.65)', fontSize: 13, marginTop: 2 },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalCount: { color: '#FFD84F', fontSize: 14, fontWeight: '900' },
  goalBar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 10, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 4 },

  empty: { alignItems: 'center', padding: 22, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(179,113,255,0.4)', gap: 6 },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 6 },
  emptyText: { color: 'rgba(234,226,247,0.6)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 10 },
  scoreBadge: { width: 46, height: 46, borderRadius: 23, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 16, fontWeight: '900' },
  historyTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  historyDate: { color: 'rgba(234,226,247,0.55)', fontSize: 12, marginTop: 2 },
});

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { OnboardingBackground, OB } from '../../components/onboarding/OnboardingUI';
import TaskList from './TaskList';
import AddTaskModal from './AddTaskModal';
import { getTasks, CalendarTask } from '../../services/calendarService';
import { useAuth } from '../../hooks/useAuth';
import { useCreatorProfile, POSTS_PER_WEEK } from '../../services/creatorProfile';
import { toLocalDateString } from '../../utils/date';
import { TASK_TYPES, typeMeta } from './taskTypes';
import { syncTaskReminders } from '../../services/notifications';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DOW = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const parse = (key: string) => new Date(`${key}T00:00:00`);
const addDays = (key: string, n: number) => { const d = parse(key); d.setDate(d.getDate() + n); return toLocalDateString(d); };
/** Lundi de la semaine d'une date */
const mondayOf = (key: string) => { const d = parse(key); return addDays(key, -((d.getDay() + 6) % 7)); };
const weekDays = (key: string) => Array.from({ length: 7 }, (_, i) => addDays(mondayOf(key), i));
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const longDate = (key: string) => { const d = parse(key); return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const shortDate = (key: string, today: string) => {
  if (key === today) return "Aujourd'hui";
  if (key === addDays(today, 1)) return 'Demain';
  const d = parse(key);
  return `${DAY_NAMES[d.getDay()].slice(0, 3)}. ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 4)}.`;
};

/** Grille du mois (lundi en premier), avec des cases vides avant le 1er. */
const monthGrid = (key: string) => {
  const d = parse(key);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let i = 1; i <= count; i++) cells.push(toLocalDateString(new Date(d.getFullYear(), d.getMonth(), i)));
  while (cells.length % 7) cells.push(null);
  return cells;
};

/** Petits points de couleur : un par type de tâche du jour (max 3). */
const Dots = ({ tasks, light }: { tasks?: CalendarTask[]; light?: boolean }) => {
  if (!tasks?.length) return <View style={styles.dotsEmpty} />;
  const types = Array.from(new Set(tasks.map((t) => t.type))).slice(0, 3);
  const allDone = tasks.every((t) => t.done);
  return (
    <View style={styles.dots}>
      {allDone ? <Ionicons name="checkmark" size={10} color={light ? '#FFF' : '#42FFB0'} /> : types.map((t) => (
        <View key={t} style={[styles.dot, { backgroundColor: light ? '#FFF' : typeMeta(t).color }]} />
      ))}
    </View>
  );
};

export default function CalendarScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { profile } = useCreatorProfile();
  const today = toLocalDateString();

  const [selected, setSelected] = useState(today);
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; type?: CalendarTask['type'] }>({ open: false });

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    try {
      const list = await getTasks(uid);
      setTasks(list);
      syncTaskReminders(list); // rappels 30 min avant chaque tâche à venir
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const byDate = useMemo(() => {
    const m: Record<string, CalendarTask[]> = {};
    tasks.forEach((t) => { (m[t.date] ||= []).push(t); });
    return m;
  }, [tasks]);
  const dayTasks = byDate[selected] ?? [];

  // ----- Objectif de la semaine (publications cochées) + série -----
  const target = POSTS_PER_WEEK[profile?.frequency ?? ''] ?? 3;
  const week = useMemo(() => {
    const days = weekDays(today);
    const publishes = tasks.filter((t) => t.type === 'publish' && days.includes(t.date));
    const done = publishes.filter((t) => t.done).length;
    // Série : semaines d'affilée avec au moins une publication cochée
    let streak = done > 0 ? 1 : 0;
    for (let w = 1; w < 52; w++) {
      const ds = weekDays(addDays(today, -7 * w));
      if (tasks.some((t) => t.type === 'publish' && t.done && ds.includes(t.date))) streak++;
      else break;
    }
    return { done, planned: publishes.length, streak };
  }, [tasks, today]);
  const progress = Math.min(1, week.done / Math.max(1, target));

  const upcoming = useMemo(
    () => tasks.filter((t) => !t.done && t.date > selected && t.date >= today).slice(0, 3),
    [tasks, selected, today]
  );

  const move = (dir: -1 | 1) => {
    Haptics.selectionAsync();
    if (mode === 'week') setSelected((s) => addDays(s, 7 * dir));
    else setSelected((s) => { const d = parse(s); return toLocalDateString(new Date(d.getFullYear(), d.getMonth() + dir, 1)); });
  };
  const pick = (key: string) => { Haptics.selectionAsync(); setSelected(key); };
  const openAdd = (type?: CalendarTask['type']) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setModal({ open: true, type }); };

  const sel = parse(selected);
  const headerLabel = `${capital(MONTHS[sel.getMonth()])} ${sel.getFullYear()}`;
  const goalText = week.done >= target
    ? 'Objectif atteint, bravo 🎉'
    : `Encore ${target - week.done} vidéo${target - week.done > 1 ? 's' : ''} pour tenir ton rythme`;

  return (
    <View style={styles.root}>
      <OnboardingBackground />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: tabBarHeight + 100, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={OB.pink} />}
      >
        {/* En-tête */}
        <View style={styles.headRow}>
          <Text style={styles.h1}>Calendrier</Text>
          <View style={styles.toggle}>
            {(['week', 'month'] as const).map((m) => (
              <TouchableOpacity key={m} onPress={() => { Haptics.selectionAsync(); setMode(m); }} style={[styles.toggleItem, mode === m && styles.toggleOn]}>
                <Text style={[styles.toggleText, mode === m && { color: '#FFF' }]}>{m === 'week' ? 'Semaine' : 'Mois'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Objectif de la semaine */}
        <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }}>
          <LinearGradient colors={['rgba(255,79,249,0.20)', 'rgba(144,19,254,0.16)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.goal}>
            <View style={styles.goalTop}>
              <View>
                <Text style={styles.goalLabel}>Cette semaine</Text>
                <Text style={styles.goalValue}>{week.done}<Text style={styles.goalOf}> / {target} vidéos publiées</Text></Text>
              </View>
              {week.streak >= 2 ? (
                <View style={styles.streak}><Text style={styles.streakText}>🔥 {week.streak} sem.</Text></View>
              ) : null}
            </View>
            <View style={styles.bar}>
              <LinearGradient colors={['#FF4FF9', '#B371FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.barFill, { width: `${Math.max(progress * 100, 4)}%` }]} />
            </View>
            <Text style={styles.goalHint}>{goalText}</Text>
          </LinearGradient>
        </MotiView>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => move(-1)} style={styles.arrow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="chevron-back" size={18} color="#FFF" /></TouchableOpacity>
          <Text style={styles.month}>{headerLabel}</Text>
          <TouchableOpacity onPress={() => move(1)} style={styles.arrow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="chevron-forward" size={18} color="#FFF" /></TouchableOpacity>
          {selected !== today ? (
            <TouchableOpacity onPress={() => pick(today)} style={styles.todayBtn}><Text style={styles.todayText}>Aujourd'hui</Text></TouchableOpacity>
          ) : null}
        </View>

        {/* Semaine ou mois */}
        {mode === 'week' ? (
          <View style={styles.weekRow}>
            {weekDays(selected).map((key, i) => {
              const on = key === selected;
              const isToday = key === today;
              const inner = (
                <>
                  <Text style={[styles.wDow, on && { color: 'rgba(255,255,255,0.85)' }]}>{DOW[i]}</Text>
                  <Text style={[styles.wNum, isToday && !on && { color: OB.pink }]}>{parse(key).getDate()}</Text>
                  <Dots tasks={byDate[key]} light={on} />
                </>
              );
              return (
                <TouchableOpacity key={key} activeOpacity={0.85} onPress={() => pick(key)} style={{ flex: 1 }}>
                  {on ? (
                    <LinearGradient colors={['#FF4FF9', '#9013FE']} style={styles.wCell}>{inner}</LinearGradient>
                  ) : (
                    <View style={[styles.wCell, styles.wIdle, isToday && styles.wToday]}>{inner}</View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.monthCard}>
            <View style={styles.mHead}>{DOW.map((d) => <Text key={d} style={styles.mDow}>{d.slice(0, 1)}</Text>)}</View>
            <View style={styles.mGrid}>
              {monthGrid(selected).map((key, i) => {
                if (!key) return <View key={`e${i}`} style={styles.mCell} />;
                const on = key === selected;
                const isToday = key === today;
                return (
                  <TouchableOpacity key={key} onPress={() => pick(key)} style={styles.mCell} activeOpacity={0.8}>
                    {on ? (
                      <LinearGradient colors={['#FF4FF9', '#9013FE']} style={styles.mDay}>
                        <Text style={styles.mNum}>{parse(key).getDate()}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.mDay, isToday && styles.mToday]}>
                        <Text style={[styles.mNum, key < today && { opacity: 0.45 }, isToday && { color: OB.pink }]}>{parse(key).getDate()}</Text>
                      </View>
                    )}
                    <Dots tasks={byDate[key]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Journée sélectionnée */}
        <View style={styles.dayHead}>
          <Text style={styles.dayTitle}>{selected === today ? "Aujourd'hui" : longDate(selected)}</Text>
          {dayTasks.length ? <Text style={styles.dayCount}>{dayTasks.filter((t) => t.done).length}/{dayTasks.length} fait</Text> : null}
        </View>

        {loading ? null : error ? (
          <TouchableOpacity onPress={() => load()} style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={30} color={OB.faint} />
            <Text style={styles.emptyTitle}>Calendrier indisponible</Text>
            <Text style={styles.emptyText}>Vérifie ta connexion, puis appuie pour réessayer.</Text>
          </TouchableOpacity>
        ) : dayTasks.length ? (
          <>
            <TaskList tasks={dayTasks} onTaskDeleted={() => load()} />
            <Text style={styles.tip}>Astuce : appuie longuement sur une tâche pour la supprimer.</Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{selected < today ? 'Rien de prévu ce jour-là' : 'Journée libre'}</Text>
            {selected >= today ? (
              <>
                <Text style={styles.emptyText}>Planifie quelque chose en un geste :</Text>
                <View style={styles.quick}>
                  {(Object.keys(TASK_TYPES) as CalendarTask['type'][]).map((k) => (
                    <TouchableOpacity key={k} onPress={() => openAdd(k)} style={[styles.quickBtn, { borderColor: `${TASK_TYPES[k].color}66` }]}>
                      <Ionicons name={TASK_TYPES[k].icon as any} size={15} color={TASK_TYPES[k].color} />
                      <Text style={styles.quickText}>{TASK_TYPES[k].short}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        )}

        {/* À venir */}
        {!dayTasks.length && upcoming.length ? (
          <>
            <Text style={styles.section}>À venir</Text>
            {upcoming.map((t) => {
              const m = typeMeta(t.type);
              return (
                <TouchableOpacity key={t.id} onPress={() => pick(t.date)} activeOpacity={0.85} style={styles.next}>
                  <View style={[styles.nextIcon, { backgroundColor: `${m.color}22` }]}><Ionicons name={m.icon as any} size={16} color={m.color} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextTitle} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.nextMeta}>{shortDate(t.date, today)} · {t.hour}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}
      </ScrollView>

      {/* Bouton + */}
      <TouchableOpacity activeOpacity={0.9} onPress={() => openAdd()} style={[styles.fab, { bottom: tabBarHeight + 16 }]} accessibilityLabel="Ajouter une tâche">
        <LinearGradient colors={['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
          <Ionicons name="add" size={30} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      <AddTaskModal
        visible={modal.open}
        defaultType={modal.type}
        defaultDate={selected}
        onClose={() => setModal({ open: false })}
        onTaskAdded={() => { setModal({ open: false }); load(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OB.bg },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  h1: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  toggle: { flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  toggleItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  toggleOn: { backgroundColor: 'rgba(255,79,249,0.35)' },
  toggleText: { color: 'rgba(234,226,247,0.6)', fontSize: 13, fontWeight: '800' },

  goal: { padding: 16, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,79,249,0.35)' },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  goalLabel: { color: 'rgba(234,226,247,0.7)', fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  goalValue: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 2 },
  goalOf: { fontSize: 15, fontWeight: '700', color: 'rgba(234,226,247,0.8)' },
  streak: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,184,79,0.18)' },
  streakText: { color: '#FFD84F', fontSize: 13, fontWeight: '900' },
  bar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 12, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  goalHint: { color: 'rgba(234,226,247,0.75)', fontSize: 13, marginTop: 8 },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, marginBottom: 12 },
  arrow: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  month: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  todayBtn: { marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,79,249,0.5)' },
  todayText: { color: OB.pink, fontSize: 12.5, fontWeight: '800' },

  weekRow: { flexDirection: 'row', gap: 6 },
  wCell: { alignItems: 'center', paddingVertical: 10, borderRadius: 16 },
  wIdle: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  wToday: { borderColor: 'rgba(255,79,249,0.6)' },
  wDow: { color: 'rgba(234,226,247,0.55)', fontSize: 11.5, fontWeight: '700' },
  wNum: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 3 },

  monthCard: { padding: 10, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(179,113,255,0.18)' },
  mHead: { flexDirection: 'row', marginBottom: 4 },
  mDow: { flex: 1, textAlign: 'center', color: 'rgba(234,226,247,0.5)', fontSize: 12, fontWeight: '800' },
  mGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  mCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  mDay: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  mToday: { borderWidth: 1.5, borderColor: 'rgba(255,79,249,0.7)' },
  mNum: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  dots: { flexDirection: 'row', gap: 3, height: 10, alignItems: 'center', marginTop: 4 },
  dotsEmpty: { height: 10, marginTop: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  dayHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  dayTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  dayCount: { color: 'rgba(234,226,247,0.6)', fontSize: 13, fontWeight: '700' },
  tip: { color: 'rgba(234,226,247,0.35)', fontSize: 12, textAlign: 'center', marginTop: 4 },

  empty: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(179,113,255,0.3)', gap: 6 },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  emptyText: { color: 'rgba(234,226,247,0.6)', fontSize: 13.5, textAlign: 'center' },
  quick: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
  quickText: { color: '#FFF', fontSize: 13.5, fontWeight: '800' },

  section: { color: '#FFF', fontSize: 17, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8 },
  nextIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  nextTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  nextMeta: { color: 'rgba(234,226,247,0.55)', fontSize: 12.5, marginTop: 2 },

  fab: { position: 'absolute', right: 20, borderRadius: 30, shadowColor: '#FF4FF9', shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  fabInner: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});

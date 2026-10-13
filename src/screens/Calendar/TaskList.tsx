import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CalendarTask, deleteTask, updateTask } from '../../services/calendarService';
import { useAuth } from '../../hooks/useAuth';
import { typeMeta } from './taskTypes';

interface TaskListProps {
  tasks: CalendarTask[];
  /** Appelé après une modification (cochée, supprimée) pour recharger */
  onTaskDeleted: () => void;
}

/**
 * Agenda d'une journée : l'heure à gauche, la tâche à droite.
 * Appui sur le rond : cocher / décocher. Appui long : menu (cocher, supprimer).
 * Appui sur la carte : afficher toutes les notes (ex. plan de tournage).
 */
export default function TaskList({ tasks, onTaskDeleted }: TaskListProps) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  // Coche affichée tout de suite, sans attendre le serveur
  const [doneOverride, setDoneOverride] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => { setDoneOverride({}); }, [tasks]);

  const isDone = (t: CalendarTask) => doneOverride[t.id] ?? !!t.done;

  const toggleDone = async (t: CalendarTask) => {
    const next = !isDone(t);
    Haptics.notificationAsync(next ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    setDoneOverride((o) => ({ ...o, [t.id]: next }));
    try {
      await updateTask(t.id, { done: next }, uid);
      onTaskDeleted();
    } catch {
      setDoneOverride((o) => ({ ...o, [t.id]: !next }));
      Alert.alert('Oups', "La tâche n'a pas pu être mise à jour. Vérifie ta connexion et réessaie.");
    }
  };

  const remove = async (t: CalendarTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await deleteTask(t.id, uid);
      onTaskDeleted();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Suppression impossible', "La tâche n'a pas pu être supprimée. Vérifie ta connexion internet et réessaie.");
    }
  };

  const openMenu = (t: CalendarTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(t.title, undefined, [
      { text: isDone(t) ? 'Marquer à faire' : 'Marquer comme fait ✓', onPress: () => toggleDone(t) },
      { text: 'Supprimer', style: 'destructive', onPress: () => remove(t) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      {tasks.map((task, i) => {
        const meta = typeMeta(task.type);
        const done = isDone(task);
        const open = expanded === task.id;
        return (
          <MotiView
            key={task.id}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: Math.min(i, 6) * 50 }}
            style={styles.row}
          >
            <View style={styles.timeCol}>
              <Text style={[styles.time, done && styles.faded]}>{task.hour}</Text>
              {i < tasks.length - 1 ? <View style={styles.rail} /> : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => task.notes && setExpanded(open ? null : task.id)}
              onLongPress={() => openMenu(task)}
              delayLongPress={350}
              style={[styles.card, done && styles.cardDone]}
            >
              <View style={[styles.bar, { backgroundColor: meta.color }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <View style={[styles.chip, { backgroundColor: `${meta.color}22` }]}>
                    <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                    <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  {task.createdBy === 'ai' ? (
                    <View style={styles.ai}><Ionicons name="sparkles" size={10} color="#B371FF" /><Text style={styles.aiText}>Plan IA</Text></View>
                  ) : null}
                </View>
                <Text style={[styles.title, done && styles.titleDone]} numberOfLines={open ? undefined : 2}>{task.title}</Text>
                {task.notes ? (
                  <Text style={[styles.notes, done && styles.faded]} numberOfLines={open ? undefined : 2}>{task.notes}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => toggleDone(task)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[styles.check, done && { backgroundColor: '#42FFB0', borderColor: '#42FFB0' }]}
                accessibilityLabel={done ? 'Marquer à faire' : 'Marquer comme fait'}
              >
                {done ? <Ionicons name="checkmark" size={16} color="#03251A" /> : null}
              </TouchableOpacity>
            </TouchableOpacity>
          </MotiView>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  row: { flexDirection: 'row', gap: 12 },
  timeCol: { width: 46, alignItems: 'center', paddingTop: 14 },
  time: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  rail: { flex: 1, width: 2, borderRadius: 1, backgroundColor: 'rgba(179,113,255,0.18)', marginTop: 8, marginBottom: -4 },
  faded: { opacity: 0.45 },
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    padding: 14, paddingLeft: 16, borderRadius: 18, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(179,113,255,0.2)',
  },
  cardDone: { backgroundColor: 'rgba(66,255,176,0.05)', borderColor: 'rgba(66,255,176,0.22)' },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  chipText: { fontSize: 11, fontWeight: '800' },
  ai: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(179,113,255,0.14)' },
  aiText: { color: '#B371FF', fontSize: 10.5, fontWeight: '800' },
  title: { color: '#FFF', fontSize: 15.5, fontWeight: '700', lineHeight: 20 },
  titleDone: { textDecorationLine: 'line-through', opacity: 0.55 },
  notes: { color: 'rgba(234,226,247,0.6)', fontSize: 13, lineHeight: 18, marginTop: 4 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
});

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { saveTask, CalendarTask } from '../../services/calendarService';
import { useAuth } from '../../hooks/useAuth';
import { toLocalDateString, isValidHourString } from '../../utils/date';
import { TASK_TYPES } from './taskTypes';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  defaultDate?: string;
  defaultType?: CalendarTask['type'];
}

const SUGGESTIONS: Record<CalendarTask['type'], string[]> = {
  publish: ['Publier une vidéo', 'Publier une tendance', 'Faire un live'],
  record: ['Tourner une vidéo', "Tourner 3 vidéos d'avance", 'Tourner une tendance'],
  idea: ['Trouver 5 idées de vidéos', 'Choisir une tendance', 'Écrire mes accroches'],
};
const HOURS = ['08:00', '12:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** 21 jours à partir d'aujourd'hui (ou autour du jour choisi s'il est loin). Jamais dans le passé. */
const buildDays = (selected: string) => {
  const today = new Date(`${toLocalDateString()}T00:00:00`);
  const offset = Math.round((+new Date(`${selected}T00:00:00`) - +today) / 864e5);
  const start = offset > 14 ? offset - 3 : 0;
  return Array.from({ length: 21 }, (_, i) => {
    const diff = start + i;
    const d = new Date(today);
    d.setDate(today.getDate() + diff);
    return { key: toLocalDateString(d), top: diff === 0 ? 'Auj.' : diff === 1 ? 'Demain' : DAYS[d.getDay()], num: d.getDate() };
  });
};

/** Feuille d'ajout : type, titre (avec idées), jour et heure en un geste — rien à taper au clavier sauf le titre. */
export default function AddTaskModal({ visible, onClose, onTaskAdded, defaultDate, defaultType }: AddTaskModalProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<CalendarTask['type']>('publish');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(defaultDate || toLocalDateString());
  const [hour, setHour] = useState('19:00');
  const [customHour, setCustomHour] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const today = toLocalDateString();
    setDate(defaultDate && defaultDate >= today ? defaultDate : today);
    setType(defaultType ?? 'publish');
    setTitle('');
    setNotes('');
    setHour('19:00');
    setCustomHour(false);
  }, [visible, defaultDate, defaultType]);

  const days = useMemo(() => buildDays(defaultDate || toLocalDateString()), [defaultDate, visible]);

  const save = async () => {
    if (saving) return;
    if (!title.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Titre manquant', 'Choisis une idée ou écris un titre.');
      return;
    }
    if (!isValidHourString(hour)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Heure invalide', 'Écris l’heure comme ceci : 19:30.');
      return;
    }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await saveTask({ date, hour, type, title: title.trim(), createdBy: 'user', ...(notes.trim() ? { notes: notes.trim() } : {}) }, user?.uid ?? null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onTaskAdded();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Enregistrement impossible', 'Vérifie ta connexion internet et réessaie.');
    } finally {
      setSaving(false);
    }
  };

  const meta = TASK_TYPES[type];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.h1}>Nouvelle tâche</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.close}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Type */}
            <View style={styles.segment}>
              {(Object.keys(TASK_TYPES) as CalendarTask['type'][]).map((k) => {
                const m = TASK_TYPES[k];
                const on = k === type;
                return (
                  <TouchableOpacity key={k} activeOpacity={0.85} onPress={() => { Haptics.selectionAsync(); setType(k); }} style={[styles.segItem, on && { backgroundColor: `${m.color}26`, borderColor: m.color }]}>
                    <Ionicons name={m.icon as any} size={16} color={on ? m.color : 'rgba(255,255,255,0.6)'} />
                    <Text style={[styles.segText, on && { color: '#FFF' }]}>{m.short}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Titre */}
            <Text style={styles.label}>Quoi ?</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={SUGGESTIONS[type][0]}
              placeholderTextColor="rgba(234,226,247,0.35)"
              style={styles.input}
              maxLength={80}
              returnKeyType="done"
            />
            <View style={styles.chips}>
              {SUGGESTIONS[type].map((sug) => (
                <TouchableOpacity key={sug} onPress={() => { Haptics.selectionAsync(); setTitle(sug); }} style={[styles.chip, title === sug && { borderColor: meta.color }]}>
                  <Text style={styles.chipText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Jour */}
            <Text style={styles.label}>Quand ?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
              {days.map((d) => {
                const on = d.key === date;
                return (
                  <TouchableOpacity key={d.key} onPress={() => { Haptics.selectionAsync(); setDate(d.key); }} activeOpacity={0.85}>
                    {on ? (
                      <LinearGradient colors={['#FF4FF9', '#9013FE']} style={styles.day}>
                        <Text style={[styles.dayTop, { color: '#FFF' }]}>{d.top}</Text>
                        <Text style={styles.dayNum}>{d.num}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.day, styles.dayIdle]}>
                        <Text style={styles.dayTop}>{d.top}</Text>
                        <Text style={styles.dayNum}>{d.num}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Heure */}
            <View style={styles.chips}>
              {HOURS.map((h) => (
                <TouchableOpacity key={h} onPress={() => { Haptics.selectionAsync(); setHour(h); setCustomHour(false); }} style={[styles.hour, !customHour && hour === h && styles.hourOn]}>
                  <Text style={[styles.hourText, !customHour && hour === h && { color: '#FFF' }]}>{h.replace(':', ' h ').replace(' h 00', ' h')}</Text>
                </TouchableOpacity>
              ))}
              {customHour ? (
                <TextInput
                  value={hour}
                  onChangeText={setHour}
                  placeholder="19:30"
                  placeholderTextColor="rgba(234,226,247,0.35)"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  autoFocus
                  style={[styles.hour, styles.hourOn, styles.hourInput]}
                />
              ) : (
                <TouchableOpacity onPress={() => { setCustomHour(true); setHour(''); }} style={styles.hour}>
                  <Text style={styles.hourText}>Autre…</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notes */}
            <Text style={styles.label}>Notes <Text style={styles.optional}>(facultatif)</Text></Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Accroche, idée de plan, son à utiliser…"
              placeholderTextColor="rgba(234,226,247,0.35)"
              style={[styles.input, styles.notes]}
              multiline
              maxLength={500}
            />
          </ScrollView>

          <TouchableOpacity activeOpacity={0.9} onPress={save} disabled={saving} style={styles.saveWrap}>
            <LinearGradient colors={['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.save}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Ajouter au calendrier</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { maxHeight: '88%', backgroundColor: '#140527', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(179,113,255,0.25)' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 14 },
  h1: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  close: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  segment: { flexDirection: 'row', gap: 8 },
  segItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
  segText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '800' },
  label: { color: '#FFF', fontSize: 14, fontWeight: '800', marginTop: 18, marginBottom: 8 },
  optional: { color: 'rgba(234,226,247,0.45)', fontWeight: '600' },
  input: { color: '#FFF', fontSize: 16, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(179,113,255,0.25)' },
  notes: { minHeight: 74, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipText: { color: 'rgba(234,226,247,0.85)', fontSize: 13, fontWeight: '600' },
  days: { gap: 8, paddingRight: 8 },
  day: { width: 54, height: 62, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayIdle: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  dayTop: { color: 'rgba(234,226,247,0.6)', fontSize: 11.5, fontWeight: '700' },
  dayNum: { color: '#FFF', fontSize: 19, fontWeight: '900', marginTop: 2 },
  hour: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  hourOn: { backgroundColor: 'rgba(255,79,249,0.2)', borderColor: '#FF4FF9' },
  hourText: { color: 'rgba(234,226,247,0.8)', fontSize: 13.5, fontWeight: '700' },
  hourInput: { color: '#FFF', fontSize: 13.5, fontWeight: '700', minWidth: 70, textAlign: 'center', paddingVertical: 7 },
  saveWrap: { marginTop: 16, borderRadius: 999, shadowColor: '#FF4FF9', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  save: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
});

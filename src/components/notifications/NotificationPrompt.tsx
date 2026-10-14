import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { enableNotifications, markNotificationsPrompted, scheduleComebackReminder, syncTaskReminders } from '../../services/notifications';
import { getTasks } from '../../services/calendarService';
import { auth } from '../../../firebase';

const PERKS = [
  { e: '🔥', t: 'Les sons qui explosent dans ta niche, avant qu’ils soient saturés' },
  { e: '📈', t: 'Les vidéos qui font des millions de vues, pour t’en inspirer' },
  { e: '⏰', t: 'Un rappel avant chaque tournage et publication de ton calendrier' },
];

/** Fenêtre « Active les notifications », affichée avant la demande officielle d'Apple. */
export default function NotificationPrompt({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const close = () => { markNotificationsPrompted(); setDenied(false); onClose(); };

  const activate = async () => {
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await enableNotifications();
    setBusy(false);
    if (result === 'granted') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      getTasks(auth.currentUser?.uid ?? null).then(syncTaskReminders).catch(() => {});
      scheduleComebackReminder();
      close();
    } else if (result === 'denied') {
      setDenied(true);
    } else {
      close();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} style={styles.card}>
          <LinearGradient colors={['#FF4FF9', '#9013FE']} style={styles.icon}><Bell size={30} color="#FFF" /></LinearGradient>
          <Text style={styles.title}>{denied ? 'Notifications désactivées' : 'Ne rate plus aucune tendance'}</Text>
          {denied ? (
            <Text style={styles.text}>Active-les dans Réglages › Viraly › Notifications pour recevoir les tendances et tes rappels.</Text>
          ) : (
            <View style={styles.perks}>
              {PERKS.map((p) => (
                <View key={p.t} style={styles.perk}>
                  <Text style={styles.emoji}>{p.e}</Text>
                  <Text style={styles.perkText}>{p.t}</Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity activeOpacity={0.9} onPress={denied ? () => { Linking.openSettings(); close(); } : activate} disabled={busy} style={{ alignSelf: 'stretch', marginTop: 20 }}>
            <LinearGradient colors={['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
              {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{denied ? 'Ouvrir les Réglages' : 'Activer les notifications'}</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={close} hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }} style={{ marginTop: 14 }}>
            <Text style={styles.later}>Plus tard</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5,0,12,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, alignItems: 'center', padding: 24, borderRadius: 28, backgroundColor: '#140527', borderWidth: 1, borderColor: 'rgba(255,79,249,0.35)' },
  icon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 16 },
  text: { color: 'rgba(234,226,247,0.75)', fontSize: 14.5, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  perks: { alignSelf: 'stretch', gap: 12, marginTop: 18 },
  perk: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emoji: { fontSize: 18 },
  perkText: { flex: 1, color: '#FFF', fontSize: 14.5, lineHeight: 20, fontWeight: '600' },
  btn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#FFF', fontSize: 16.5, fontWeight: '900' },
  later: { color: 'rgba(234,226,247,0.55)', fontSize: 14.5, fontWeight: '700' },
});

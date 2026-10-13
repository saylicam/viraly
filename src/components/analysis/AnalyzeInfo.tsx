import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gauge, Zap, Wrench, Clock, Smartphone, Timer, Sun } from 'lucide-react-native';

const YOU_GET = [
  { Icon: Gauge, color: '#42FFB0', text: 'Une note sur 100 et un verdict clair' },
  { Icon: Zap, color: '#FF4FF9', text: 'Ce qui accroche (ou pas) dès les premières secondes' },
  { Icon: Wrench, color: '#4FC3FF', text: 'Des corrections concrètes avant de publier' },
  { Icon: Clock, color: '#FFD84F', text: 'Légende, hashtags et meilleurs horaires' },
];

const TIPS = [
  { Icon: Smartphone, text: 'Format vertical (9:16)' },
  { Icon: Timer, text: 'Moins de 60 secondes' },
  { Icon: Sun, text: 'Ta version finale, avant de publier' },
];

export const AnalyzeInfo = () => (
  <View>
    <Text style={styles.title}>Ce que tu vas recevoir</Text>
    <View style={styles.card}>
      {YOU_GET.map(({ Icon, color, text }) => (
        <View key={text} style={styles.row}>
          <View style={[styles.icon, { backgroundColor: `${color}1F` }]}><Icon size={18} color={color} /></View>
          <Text style={styles.text}>{text}</Text>
        </View>
      ))}
    </View>

    <Text style={[styles.title, { marginTop: 24 }]}>Pour une analyse au top</Text>
    <View style={styles.tips}>
      {TIPS.map(({ Icon, text }) => (
        <View key={text} style={styles.tip}>
          <Icon size={18} color="#B371FF" />
          <Text style={styles.tipText}>{text}</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  title: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', marginBottom: 12 },
  card: { borderRadius: 22, padding: 16, gap: 14, backgroundColor: '#1B0730', borderWidth: 1, borderColor: 'rgba(179, 113, 255, 0.3)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '600', lineHeight: 20 },
  tips: { flexDirection: 'row', gap: 10 },
  tip: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(179, 113, 255, 0.25)' },
  tipText: { color: 'rgba(234,226,247,0.8)', fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Music, Music2, Flame, ChevronRight } from 'lucide-react-native';
import { apiService, resolveApiUrl } from '../../services/api';
import { useUserProfile } from '../../hooks/useUserProfile';

interface Sound {
  id: string; title: string; artist: string; cover: string | null; url: string;
  usageCount: number | null; stage?: 'emerging' | 'peak' | 'declining';
}

const fmt = (n?: number | null) => {
  if (n == null) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M vidéos`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k vidéos`;
  return `${n} vidéos`;
};

const STAGE_LABEL = { emerging: '🌱 Émergent', peak: '🔥 Au sommet', declining: '📉 En déclin' } as const;

/** « 3 sons tendance pour ta vidéo », d'après la niche du créateur. */
export default function TrendingSoundsSuggestion({ onSeeAll }: { onSeeAll: () => void }) {
  const { profileData } = useUserProfile();
  const niche: string | undefined = Array.isArray(profileData?.niches) ? profileData.niches[0] : undefined;
  const [sounds, setSounds] = useState<Sound[]>([]);

  useEffect(() => {
    let alive = true;
    apiService.getTrends(niche).then((res) => {
      if (!alive || !res.success) return;
      const list: Sound[] = (res.data as any)?.data?.sounds ?? [];
      // On évite les sons en déclin quand on a mieux
      const fresh = list.filter((s) => s.stage !== 'declining');
      setSounds((fresh.length >= 3 ? fresh : list).slice(0, 3));
    }).catch(() => {});
    return () => { alive = false; };
  }, [niche]);

  if (!sounds.length) return null;

  return (
    <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 1200 }}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.icon}><Music size={20} color="#FF4FF9" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>3 sons tendance pour ta vidéo</Text>
            <Text style={styles.subtitle}>Un son qui monte peut multiplier ta portée</Text>
          </View>
        </View>
        {sounds.map((s) => {
          const cover = resolveApiUrl(s.cover);
          return (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.85}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(s.url).catch(() => {}); }}
              style={styles.row}
            >
              {cover ? <Image source={{ uri: cover }} style={styles.cover} /> : (
                <LinearGradient colors={['#7B33F7', '#FF4FF9']} style={[styles.cover, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Music2 size={18} color="#FFF" />
                </LinearGradient>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.soundTitle} numberOfLines={1}>{s.title}</Text>
                <Text style={styles.soundMeta} numberOfLines={1}>
                  {[s.stage ? STAGE_LABEL[s.stage] : null, fmt(s.usageCount)].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Text style={styles.use}>Utiliser</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={onSeeAll} style={styles.more}>
          <Flame size={15} color="#FF4FF9" />
          <Text style={styles.moreText}>Voir toutes les tendances</Text>
          <ChevronRight size={16} color="#FF4FF9" />
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28, backgroundColor: 'rgba(144, 19, 254, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 79, 249, 0.35)',
    padding: 20, marginBottom: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 79, 249, 0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 13, color: '#A1A1AA', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  cover: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2A0F45' },
  soundTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  soundMeta: { color: '#D9C8F5', fontSize: 12, marginTop: 2 },
  use: { color: '#FFF', fontSize: 12, fontWeight: '800', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255, 79, 249, 0.35)', overflow: 'hidden' },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(179, 113, 255, 0.2)' },
  moreText: { color: '#FF4FF9', fontSize: 14, fontWeight: '800' },
});

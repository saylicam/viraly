import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';
import { ChevronRight, Fingerprint, TrendingUp, Sparkles } from 'lucide-react-native';
import type { CreatorProfile } from '../../services/creatorProfile';
import { useAccountAudit, progressSince } from '../../services/accountAudit';
import { formatCount, formatDelta } from '../../utils/format';

const PINK = '#FF4FF9';
const GREEN = '#42FFB0';
const scoreColor = (s: number) => (s >= 75 ? GREEN : s >= 60 ? '#4FC3FF' : s >= 45 ? '#FFD84F' : '#FF6B8A');

const MiniRing = ({ value }: { value: number }) => {
  const size = 58;
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={6} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={scoreColor(value)} strokeWidth={6} fill="none" strokeLinecap="round"
          strokeDasharray={`${c}`} strokeDashoffset={c * (1 - value / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Text style={styles.ringValue}>{value}</Text>
    </View>
  );
};

/** Carte « Bilan de ton compte TikTok » sur l'accueil. */
export default function AccountCard({ profile, onPress }: { profile: CreatorProfile | null; onPress: () => void }) {
  const handle = profile?.tiktok ?? null;
  const { audit, history } = useAccountAudit(handle);
  const preview = profile?.tiktokPreview?.handle === handle ? profile?.tiktokPreview : null;
  const progress = progressSince(history);

  if (!handle) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <LinearGradient colors={['rgba(79,195,255,0.16)', 'rgba(155,77,255,0.14)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.empty}>
          <View style={styles.emptyIcon}><Fingerprint size={22} color="#FFF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emptyTitle}>Le bilan de ton compte TikTok</Text>
            <Text style={styles.emptyText}>Ajoute ton @ : l’IA étudie tes vidéos et te dit ce qui marche chez toi.</Text>
          </View>
          <ChevronRight size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const avatar = audit?.profile.avatar ?? preview?.avatar ?? null;
  const nickname = audit?.profile.nickname ?? preview?.nickname ?? `@${handle}`;

  return (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }}>
      <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.card}>
        <View style={styles.glow} />
        <View style={styles.top}>
          <LinearGradient colors={[PINK, '#9B4DFF', '#4FC3FF']} style={styles.avatarRing}>
            {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: '#2A1650' }]} />}
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>BILAN DE TON COMPTE</Text>
            <Text style={styles.name} numberOfLines={1}>{nickname}</Text>
            <Text style={styles.handle}>@{handle}</Text>
          </View>
          {audit ? <MiniRing value={audit.score.total} /> : (
            <View style={styles.newBadge}><Sparkles size={13} color="#FFF" /><Text style={styles.newText}>Prêt</Text></View>
          )}
        </View>

        {audit ? (
          <>
            <View style={styles.stats}>
              {[
                { v: formatCount(audit.profile.followers), l: 'abonnés' },
                { v: formatCount(audit.stats.medianViews), l: 'vues / vidéo' },
                { v: `${String(audit.stats.engagementRate).replace('.', ',')} %`, l: 'engagement' },
              ].map((x) => (
                <View key={x.l} style={styles.stat}>
                  <Text style={styles.statValue}>{x.v}</Text>
                  <Text style={styles.statLabel}>{x.l}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.verdict} numberOfLines={2}>{audit.insights.titre}</Text>
            <View style={styles.bottom}>
              {progress && progress.followers ? (
                <View style={styles.delta}><TrendingUp size={13} color={progress.followers > 0 ? GREEN : '#FF6B8A'} /><Text style={[styles.deltaText, progress.followers < 0 && { color: '#FF6B8A' }]}>{formatDelta(progress.followers)} abonnés</Text></View>
              ) : <View />}
              <View style={styles.see}><Text style={styles.seeText}>Voir mon bilan</Text><ChevronRight size={16} color={PINK} /></View>
            </View>
          </>
        ) : (
          <>
            {preview ? (
              <View style={styles.stats}>
                {[{ v: preview.followers, l: 'abonnés' }, { v: preview.likes, l: 'j’aime' }, { v: preview.videoCount, l: 'vidéos' }].map((x) => (
                  <View key={x.l} style={styles.stat}><Text style={styles.statValue}>{formatCount(x.v)}</Text><Text style={styles.statLabel}>{x.l}</Text></View>
                ))}
              </View>
            ) : null}
            <LinearGradient colors={[PINK, '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
              <Sparkles size={16} color="#FFF" />
              <Text style={styles.ctaText}>Lancer mon bilan</Text>
            </LinearGradient>
          </>
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 16, backgroundColor: '#150626', borderWidth: 1, borderColor: 'rgba(179,113,255,0.3)', overflow: 'hidden' },
  glow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,79,249,0.12)', top: -70, right: -50 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: { padding: 2.5, borderRadius: 30 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#150626' },
  kicker: { color: '#8E7AAE', fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  name: { color: '#FFF', fontSize: 16.5, fontWeight: '900', marginTop: 1 },
  handle: { color: '#B9A6D9', fontSize: 12.5, fontWeight: '600' },
  ringValue: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  newBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(66,255,176,0.2)' },
  newText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 16.5, fontWeight: '900' },
  statLabel: { color: '#8E7AAE', fontSize: 11, fontWeight: '700', marginTop: 1 },
  verdict: { color: '#F2D6FF', fontSize: 14, lineHeight: 19, fontWeight: '700', marginTop: 12 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deltaText: { color: GREEN, fontSize: 12.5, fontWeight: '800' },
  see: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeText: { color: PINK, fontSize: 13.5, fontWeight: '800' },
  cta: { marginTop: 14, height: 46, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(79,195,255,0.3)' },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(79,195,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  emptyText: { color: '#B9A6D9', fontSize: 12.5, lineHeight: 17, marginTop: 2 },
});

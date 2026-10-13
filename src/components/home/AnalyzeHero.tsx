import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';
import { Upload, Sparkles } from 'lucide-react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PILLAR_COLORS = ['#FF4FF9', '#4FC3FF', '#42FFB0', '#FFD84F', '#B371FF'];

/** Mini aperçu animé d'un résultat : la note qui se remplit + les 5 piliers. */
const ScorePreview = ({ value }: { value: number }) => {
  const size = 96;
  const r = 40;
  const c = 2 * Math.PI * r;
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(fill, { toValue: value / 100, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.delay(2200),
      Animated.timing(fill, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [fill, value]);
  const offset = fill.interpolate({ inputRange: [0, 1], outputRange: [c, 0] });

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.22)" strokeWidth={8} fill="none" />
          <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke="#FFFFFF" strokeWidth={8} fill="none" strokeLinecap="round"
            strokeDasharray={`${c}`} strokeDashoffset={offset as any} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        </Svg>
        <Text style={styles.previewValue}>{value}</Text>
        <Text style={styles.previewMax}>/100</Text>
      </View>
      <View style={styles.dots}>
        {PILLAR_COLORS.map((col, i) => (
          <MotiView key={col} from={{ scale: 0.4, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ loop: true, type: 'timing', duration: 900, delay: i * 160 }} style={[styles.dot, { backgroundColor: col }]} />
        ))}
      </View>
    </View>
  );
};

/**
 * Carte principale de l'accueil : la fonction phare (analyse vidéo) doit être la première chose qu'on voit.
 */
export default function AnalyzeHero({ onPress, lastScore, potential, freeLeft }: { onPress: () => void; lastScore?: number | null; potential?: number | null; freeLeft?: number | null }) {
  return (
    <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 450 }}>
      <TouchableOpacity activeOpacity={0.93} onPress={onPress}>
        <LinearGradient colors={['#FF4FF9', '#B53CFF', '#7B1FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.glow} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.badge}><Sparkles size={12} color="#FFF" /><Text style={styles.badgeText}>Analyse IA</Text></View>
              <Text style={styles.title}>Analyse ta prochaine vidéo</Text>
              <Text style={styles.text}>Ta note sur 100, les moments où tu perds tes spectateurs et le montage idéal.</Text>
            </View>
            <ScorePreview value={lastScore ?? 88} />
          </View>

          <View style={styles.button}>
            <Upload size={18} color="#7B1FE0" strokeWidth={2.6} />
            <Text style={styles.buttonText}>Choisir une vidéo</Text>
          </View>

          {freeLeft != null ? (
            <Text style={styles.footer}>
              {freeLeft > 0 ? `Il te reste ${freeLeft} analyse${freeLeft > 1 ? 's' : ''} gratuite${freeLeft > 1 ? 's' : ''} aujourd’hui` : 'Analyses gratuites du jour utilisées · illimité avec Premium'}
            </Text>
          ) : null}
          <Text style={[styles.footer, freeLeft != null && { marginTop: 2, opacity: 0.8 }]}>
            {lastScore != null
              ? potential && potential > lastScore
                ? `Ta dernière note : ${lastScore} · tu peux viser ${potential}`
                : `Ta dernière note : ${lastScore} · fais encore mieux`
              : 'Résultat en 30 secondes, avant de publier'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28, padding: 18, overflow: 'hidden',
    shadowColor: '#FF4FF9', shadowOpacity: 0.45, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 14,
  },
  glow: { position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)' },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { color: '#FFF', fontSize: 23, fontWeight: '900', lineHeight: 27, marginTop: 10, letterSpacing: -0.3 },
  text: { color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 18, marginTop: 6 },
  previewValue: { color: '#FFF', fontSize: 28, fontWeight: '900', lineHeight: 30 },
  previewMax: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800' },
  dots: { flexDirection: 'row', gap: 5, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16, height: 52, borderRadius: 999, backgroundColor: '#FFFFFF' },
  buttonText: { color: '#5A0FB0', fontSize: 17, fontWeight: '900' },
  footer: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 10 },
});

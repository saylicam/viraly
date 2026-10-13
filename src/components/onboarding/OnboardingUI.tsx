import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

export const OB = {
  bg: '#0A0214',
  card: 'rgba(255, 255, 255, 0.05)',
  cardActive: 'rgba(255, 79, 249, 0.14)',
  border: 'rgba(179, 113, 255, 0.28)',
  borderActive: '#FF4FF9',
  pink: '#FF4FF9',
  violet: '#9013FE',
  lilac: '#B371FF',
  text: '#FFFFFF',
  muted: 'rgba(234, 226, 247, 0.72)',
  faint: 'rgba(234, 226, 247, 0.45)',
};

/** Fond commun : violet profond + deux halos doux (même univers que le reste de l'app). */
export const OnboardingBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#14042A', '#0A0214', '#07010F']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="haloPink" cx="85%" cy="8%" rx="65%" ry="38%" fx="85%" fy="8%">
          <Stop offset="0" stopColor="#FF4FF9" stopOpacity="0.26" />
          <Stop offset="1" stopColor="#FF4FF9" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="haloViolet" cx="10%" cy="95%" rx="75%" ry="40%" fx="10%" fy="95%">
          <Stop offset="0" stopColor="#7B33F7" stopOpacity="0.32" />
          <Stop offset="1" stopColor="#7B33F7" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#haloPink)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#haloViolet)" />
    </Svg>
  </View>
);

/**
 * Écran d'onboarding : contenu en haut, actions fixées en bas (jamais besoin de scroller pour le bouton).
 */
export const OnboardingShell = ({ children, footer, contentStyle }: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <OnboardingBackground />
      <View style={[styles.content, { paddingTop: insets.top + 12 }, contentStyle]}>{children}</View>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>{footer}</View> : null}
    </View>
  );
};

export const PrimaryButton = ({ label, onPress, disabled, loading, icon }: {
  label: string; onPress: () => void; disabled?: boolean; loading?: boolean; icon?: React.ReactNode;
}) => (
  <TouchableOpacity
    activeOpacity={0.9}
    disabled={disabled || loading}
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
    style={[styles.primaryWrap, (disabled || loading) && { opacity: 0.45 }]}
  >
    <LinearGradient colors={[OB.pink, OB.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primary}>
      {loading ? <ActivityIndicator color="#FFF" /> : (
        <>
          <Text style={styles.primaryText}>{label}</Text>
          {icon}
        </>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

export const TextLink = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }} style={{ alignSelf: 'center', marginTop: 14 }}>
    <Text style={styles.link}>{label}</Text>
  </TouchableOpacity>
);

/** Barre de progression segmentée (une barre par étape). */
export const StepBar = ({ step, total }: { step: number; total: number }) => (
  <View style={styles.stepBar}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={[styles.stepSeg, i <= step && styles.stepSegOn]}>
        {i <= step ? <LinearGradient colors={[OB.pink, OB.lilac]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /> : null}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: OB.bg },
  content: { flex: 1, paddingHorizontal: 24 },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  primaryWrap: {
    borderRadius: 999,
    shadowColor: OB.pink, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  primary: { height: 58, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  link: { color: OB.muted, fontSize: 15, fontWeight: '600' },
  stepBar: { flexDirection: 'row', gap: 6 },
  stepSeg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  stepSegOn: {},
});

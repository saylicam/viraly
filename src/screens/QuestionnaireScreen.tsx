import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { ChevronLeft, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { OnboardingShell, PrimaryButton, StepBar, TextLink, OB } from '../components/onboarding/OnboardingUI';
import { useAuth } from '../hooks/useAuth';
import { answersToProfile, saveCreatorProfile, normalizeTikTok, loadLocalProfile, type TikTokPreview } from '../services/creatorProfile';
import { apiService } from '../services/api';
import { formatCount } from '../utils/format';

interface QuestionnaireScreenProps {
  navigation: any;
}

type Option = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; sub?: string };
interface Step {
  key: string;
  title: (name: string) => string;
  subtitle: string;
  kind: 'text' | 'single' | 'multi' | 'handle';
  max?: number;
  options?: Option[];
}

const MAX_NICHES = 3;

const STEPS: Step[] = [
  {
    key: 'name',
    kind: 'text',
    title: () => 'Comment on t’appelle ?',
    subtitle: 'Ton prénom ou ton pseudo de créateur',
  },
  {
    key: 'level',
    kind: 'single',
    title: (n) => (n ? `Enchanté ${n} 👋\nOù en es-tu sur TikTok ?` : 'Où en es-tu sur TikTok ?'),
    subtitle: 'Ton coaching s’adapte à ton niveau',
    options: [
      { key: 'beginner', label: 'Je débute', icon: 'leaf-outline', sub: 'Peu ou pas de vidéos publiées' },
      { key: 'intermediate', label: 'Intermédiaire', icon: 'trending-up-outline', sub: 'Moins de 10 k vues par vidéo' },
      { key: 'advanced', label: 'Avancé·e', icon: 'rocket-outline', sub: '10 k à 50 k vues par vidéo' },
      { key: 'pro', label: 'Pro', icon: 'trophy-outline', sub: 'Plus de 50 k vues par vidéo' },
    ],
  },
  {
    key: 'niches',
    kind: 'multi',
    max: MAX_NICHES,
    title: () => 'Tu fais quel type de contenu ?',
    subtitle: `Choisis jusqu’à ${MAX_NICHES} niches. La première sera ta niche principale.`,
    options: [
      { key: 'comedy', label: 'Comédie', icon: 'happy-outline' },
      { key: 'music', label: 'Musique', icon: 'musical-notes-outline' },
      { key: 'beauty', label: 'Beauté', icon: 'sparkles-outline' },
      { key: 'education', label: 'Éducation', icon: 'school-outline' },
      { key: 'gaming', label: 'Gaming', icon: 'game-controller-outline' },
      { key: 'fitness', label: 'Fitness', icon: 'barbell-outline' },
      { key: 'tech', label: 'Tech', icon: 'hardware-chip-outline' },
      { key: 'food', label: 'Cuisine', icon: 'restaurant-outline' },
      { key: 'travel', label: 'Voyages', icon: 'airplane-outline' },
    ],
  },
  {
    key: 'tiktok',
    kind: 'handle',
    title: () => 'Ton compte TikTok ?',
    subtitle: 'L’IA étudie tes vraies vidéos pour des conseils faits pour toi. Facultatif.',
  },
  {
    key: 'goal',
    kind: 'single',
    title: () => 'Ton objectif principal ?',
    subtitle: 'On priorise les conseils qui t’en rapprochent',
    options: [
      { key: 'views', label: 'Faire plus de vues', icon: 'eye-outline', sub: 'Être vu par plus de monde' },
      { key: 'engagement', label: 'Plus d’engagement', icon: 'heart-outline', sub: 'Likes, commentaires, partages' },
      { key: 'fanbase', label: 'Construire ma communauté', icon: 'people-outline', sub: 'Des abonnés qui reviennent' },
      { key: 'monetization', label: 'Monétiser mon contenu', icon: 'cash-outline', sub: 'Partenariats et revenus' },
    ],
  },
  {
    key: 'blocker',
    kind: 'single',
    title: () => 'Qu’est-ce qui te bloque le plus ?',
    subtitle: 'Sois honnête : ton plan va s’attaquer à ça en premier',
    options: [
      { key: 'ideas', label: 'Trouver des idées', icon: 'bulb-outline', sub: 'Je ne sais pas quoi filmer' },
      { key: 'hook', label: 'Accrocher dès le début', icon: 'flash-outline', sub: 'Les gens scrollent trop vite' },
      { key: 'consistency', label: 'Être régulier', icon: 'repeat-outline', sub: 'Je publie, puis j’arrête' },
      { key: 'editing', label: 'Le montage', icon: 'cut-outline', sub: 'Ça me prend trop de temps' },
      { key: 'algorithm', label: 'Comprendre l’algorithme', icon: 'help-circle-outline', sub: 'Je ne sais pas pourquoi ça marche ou pas' },
    ],
  },
  {
    key: 'frequency',
    kind: 'single',
    title: () => 'Ton rythme idéal ?',
    subtitle: 'On remplit ton calendrier avec les meilleurs créneaux',
    options: [
      { key: '1week', label: '1 vidéo par semaine', icon: 'calendar-clear-outline', sub: 'Tranquille, mais régulier' },
      { key: '2week', label: '2 à 3 vidéos par semaine', icon: 'calendar-outline', sub: 'Le bon équilibre pour grandir' },
      { key: 'daily', label: 'Presque tous les jours', icon: 'flame-outline', sub: 'Pour accélérer' },
      { key: 'irregular', label: 'Quand j’ai le temps', icon: 'time-outline', sub: 'Pas de pression' },
    ],
  },
];

export default function QuestionnaireScreen({ navigation }: QuestionnaireScreenProps) {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [handle, setHandle] = useState('');
  const [preview, setPreview] = useState<TikTokPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  // Profil modifié depuis l'app : on repart du compte TikTok déjà relié
  React.useEffect(() => {
    loadLocalProfile().then((p) => { if (p?.tiktok) setHandle(p.tiktok); }).catch(() => {});
  }, []);
  const advancing = useRef(false);

  const step = STEPS[index];
  const selected = answers[step.key] ?? [];
  const firstName = name.trim().split(/\s+/)[0] ?? '';
  const isLast = index === STEPS.length - 1;

  const finish = async (final: Record<string, string[]>) => {
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const uid = user?.uid ?? null;
    const prof = answersToProfile(final);
    await saveCreatorProfile({ ...prof, ...(preview && prof.tiktok === preview.handle ? { tiktokPreview: preview } : {}) }, uid).catch(() => {});
    setSaving(false);
    navigation.navigate('Calculating', { answers: final });
  };

  const next = (final = answers) => {
    advancing.current = false;
    if (isLast) finish(final);
    else setIndex((i) => i + 1);
  };

  const back = () => {
    Haptics.selectionAsync();
    if (index === 0) { if (navigation.canGoBack()) navigation.goBack(); }
    else setIndex((i) => i - 1);
  };

  const choose = (key: string) => {
    if (advancing.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step.kind === 'multi') {
      const has = selected.includes(key);
      if (!has && selected.length >= (step.max ?? 99)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      setAnswers((a) => ({ ...a, [step.key]: has ? selected.filter((k) => k !== key) : [...selected, key] }));
      return;
    }
    // Choix unique : on passe tout seul à la question suivante
    const final = { ...answers, [step.key]: [key] };
    setAnswers(final);
    advancing.current = true;
    setTimeout(() => next(final), 280);
  };

  const submitName = () => {
    Keyboard.dismiss();
    const final = { ...answers, name: [name.trim()] };
    setAnswers(final);
    next(final);
  };

  // Compte TikTok : on vérifie qu'il existe et on montre la photo pour confirmer
  const checkHandle = async () => {
    Keyboard.dismiss();
    const h = normalizeTikTok(handle);
    if (!h) {
      setHandleError('Écris ton pseudo TikTok, par exemple @ton.pseudo');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setHandleError(null);
    setChecking(true);
    const res = await apiService.previewTikTok(h);
    setChecking(false);
    if (res.success && res.data) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPreview(res.data);
    } else if (res.code === 'NOT_FOUND' || res.code === 'INVALID_HANDLE') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setHandleError(res.error ?? 'Compte introuvable. Vérifie l’orthographe.');
    } else {
      // Service momentanément indisponible : on garde le pseudo, le bilan se fera plus tard
      confirmHandle(h);
    }
  };

  const confirmHandle = (h: string) => {
    const final = { ...answers, tiktok: [h] };
    setAnswers(final);
    next(final);
  };

  const skipHandle = () => {
    Keyboard.dismiss();
    setPreview(null);
    const { tiktok, ...rest } = answers;
    setAnswers(rest);
    next(rest);
  };

  const footer = step.kind === 'handle' ? (
    preview ? (
      <>
        <PrimaryButton label="Oui, c’est moi" onPress={() => confirmHandle(preview.handle)} />
        <TextLink label="Ce n’est pas mon compte" onPress={() => { setPreview(null); setHandle(''); }} />
      </>
    ) : (
      <>
        <PrimaryButton label={checking ? 'Recherche de ton compte…' : 'Trouver mon compte'} onPress={checkHandle} loading={checking} disabled={handle.replace(/^@/, '').trim().length < 2} />
        <TextLink label="Je n’ai pas encore de compte TikTok" onPress={skipHandle} />
      </>
    )
  ) : step.kind === 'text' ? (
    <>
      <PrimaryButton label="Continuer" onPress={submitName} disabled={name.trim().length < 2} />
      <TextLink label="Passer cette étape" onPress={() => { Keyboard.dismiss(); next(); }} />
    </>
  ) : step.kind === 'multi' ? (
    <PrimaryButton
      label={selected.length ? `Continuer (${selected.length}/${step.max})` : 'Choisis au moins une niche'}
      onPress={() => next()}
      disabled={!selected.length}
    />
  ) : isLast && saving ? (
    <PrimaryButton label="Création de ton plan…" onPress={() => {}} loading />
  ) : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: OB.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <OnboardingShell footer={footer}>
        {/* En-tête : retour + progression */}
        <View style={styles.header}>
          <TouchableOpacity onPress={back} style={styles.back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}><StepBar step={index} total={STEPS.length} /></View>
          <Text style={styles.count}>{index + 1}/{STEPS.length}</Text>
        </View>

        <MotiView key={step.key} from={{ opacity: 0, translateX: 24 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 320 }} style={{ flex: 1 }}>
          <Text style={styles.title}>{step.title(firstName)}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>

          {step.kind === 'handle' ? (
            preview ? (
              <MotiView from={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 14 }}>
                <LinearGradient colors={['rgba(255,79,249,0.22)', 'rgba(123,31,224,0.18)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.found}>
                  <View style={styles.avatarRing}>
                    {preview.avatar ? <Image source={{ uri: preview.avatar }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarEmpty]}><Text style={styles.avatarLetter}>{preview.nickname.slice(0, 1).toUpperCase()}</Text></View>}
                  </View>
                  <Text style={styles.foundName} numberOfLines={1}>{preview.nickname}{preview.verified ? ' ✓' : ''}</Text>
                  <Text style={styles.foundHandle}>@{preview.handle}</Text>
                  <View style={styles.foundStats}>
                    {[
                      { v: preview.followers, l: 'abonnés' },
                      { v: preview.likes, l: 'j’aime' },
                      { v: preview.videoCount, l: 'vidéos' },
                    ].map((x, i) => (
                      <MotiView key={x.l} from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200 + i * 120 }} style={styles.foundStat}>
                        <Text style={styles.foundValue}>{formatCount(x.v)}</Text>
                        <Text style={styles.foundLabel}>{x.l}</Text>
                      </MotiView>
                    ))}
                  </View>
                  <Text style={styles.foundHint}>✨ Ton bilan complet t’attend dans l’app</Text>
                </LinearGradient>
              </MotiView>
            ) : (
              <View style={styles.inputWrap}>
                <View style={[styles.handleBox, handleError && { borderColor: '#FF6B8B' }]}>
                  <Text style={styles.at}>@</Text>
                  <TextInput
                    value={handle.replace(/^@+/, '')}
                    onChangeText={(t) => { setHandle(t); setHandleError(null); }}
                    placeholder="ton.pseudo"
                    placeholderTextColor={OB.faint}
                    style={styles.handleInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType={Platform.OS === 'ios' ? 'twitter' : 'default'}
                    maxLength={60}
                    returnKeyType="search"
                    onSubmitEditing={checkHandle}
                  />
                  {checking ? <ActivityIndicator color={OB.pink} /> : null}
                </View>
                {handleError ? <Text style={styles.handleError}>{handleError}</Text> : null}
                <View style={styles.perks}>
                  {[
                    { i: 'stats-chart-outline' as const, t: 'Tes vraies stats : vues, engagement, régularité' },
                    { i: 'sparkles-outline' as const, t: 'Ce qui marche chez toi, et pourquoi' },
                    { i: 'lock-closed-outline' as const, t: 'Aucun mot de passe : on lit seulement ton profil public' },
                  ].map((p) => (
                    <View key={p.t} style={styles.perk}>
                      <Ionicons name={p.i} size={17} color={OB.pink} />
                      <Text style={styles.perkText}>{p.t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          ) : step.kind === 'text' ? (
            <View style={styles.inputWrap}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ton prénom"
                placeholderTextColor={OB.faint}
                style={styles.input}
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={24}
                returnKeyType="next"
                onSubmitEditing={() => name.trim().length >= 2 && submitName()}
              />
              <Text style={styles.inputHint}>On l’utilise seulement pour te parler dans l’app.</Text>
            </View>
          ) : step.kind === 'multi' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
              {step.options!.map((o) => {
                const pos = selected.indexOf(o.key);
                const on = pos >= 0;
                return (
                  <TouchableOpacity key={o.key} activeOpacity={0.85} onPress={() => choose(o.key)} style={[styles.tile, on && styles.optionOn]}>
                    <Ionicons name={o.icon} size={22} color={on ? OB.pink : '#D9C8F5'} />
                    <Text style={[styles.tileLabel, on && { color: '#FFF' }]}>{o.label}</Text>
                    {on ? (
                      <View style={styles.tileBadge}><Text style={styles.tileBadgeText}>{pos === 0 ? '★' : pos + 1}</Text></View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {step.options!.map((o) => {
                const on = selected.includes(o.key);
                return (
                  <TouchableOpacity key={o.key} activeOpacity={0.85} onPress={() => choose(o.key)} style={[styles.option, on && styles.optionOn]}>
                    <View style={[styles.optionIcon, on && { backgroundColor: 'rgba(255,79,249,0.25)' }]}>
                      <Ionicons name={o.icon} size={21} color={on ? '#FFF' : '#D9C8F5'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionLabel}>{o.label}</Text>
                      {o.sub ? <Text style={styles.optionSub}>{o.sub}</Text> : null}
                    </View>
                    <View style={[styles.radio, on && styles.radioOn]}>{on ? <Check size={14} color="#FFF" strokeWidth={3} /> : null}</View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </MotiView>
      </OnboardingShell>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 26 },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  count: { color: OB.faint, fontSize: 13, fontWeight: '700', width: 30, textAlign: 'right' },

  title: { color: '#FFF', fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { color: OB.muted, fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 22 },

  inputWrap: { marginTop: 6 },
  input: {
    height: 62, borderRadius: 18, paddingHorizontal: 20, fontSize: 20, fontWeight: '700', color: '#FFF',
    backgroundColor: OB.card, borderWidth: 1.5, borderColor: OB.border,
  },
  inputHint: { color: OB.faint, fontSize: 13, marginTop: 10, marginLeft: 4 },

  handleBox: {
    height: 62, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: OB.card, borderWidth: 1.5, borderColor: OB.border,
  },
  at: { color: OB.pink, fontSize: 22, fontWeight: '900' },
  handleInput: { flex: 1, height: '100%', fontSize: 20, fontWeight: '700', color: '#FFF' },
  handleError: { color: '#FF8FA8', fontSize: 13, fontWeight: '600', marginTop: 10, marginLeft: 4 },
  perks: { marginTop: 22, gap: 12 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { color: OB.muted, fontSize: 14, flex: 1 },

  found: { borderRadius: 26, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,79,249,0.35)' },
  avatarRing: { padding: 3, borderRadius: 52, backgroundColor: OB.pink },
  avatar: { width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: OB.bg },
  avatarEmpty: { backgroundColor: '#2A1650', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#FFF', fontSize: 34, fontWeight: '900' },
  foundName: { color: '#FFF', fontSize: 21, fontWeight: '900', marginTop: 14 },
  foundHandle: { color: OB.muted, fontSize: 14, fontWeight: '600', marginTop: 2 },
  foundStats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 18, gap: 8 },
  foundStat: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)' },
  foundValue: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  foundLabel: { color: OB.faint, fontSize: 12, fontWeight: '700', marginTop: 2 },
  foundHint: { color: '#F5D9FF', fontSize: 13, fontWeight: '700', marginTop: 16 },

  list: { gap: 10, paddingBottom: 16 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 20, backgroundColor: OB.card, borderWidth: 1.5, borderColor: OB.border,
  },
  optionOn: { backgroundColor: OB.cardActive, borderColor: OB.borderActive },
  optionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(179,113,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  optionLabel: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  optionSub: { color: OB.faint, fontSize: 13, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: OB.pink, borderColor: OB.pink },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 16 },
  tile: {
    width: '48%', flexGrow: 1, height: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16,
    borderRadius: 18, backgroundColor: OB.card, borderWidth: 1.5, borderColor: OB.border,
  },
  tileLabel: { color: '#D9C8F5', fontSize: 15, fontWeight: '700', flex: 1 },
  tileBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: OB.pink, alignItems: 'center', justifyContent: 'center' },
  tileBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
});

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { Sparkles, CalendarDays, ArrowRight, Flame, Wand2, ScanSearch } from 'lucide-react-native';
import { OnboardingShell, PrimaryButton, OB } from '../components/onboarding/OnboardingUI';
import { useAuth } from '../hooks/useAuth';
import { useSession } from '../context/SessionContext';
import {
  answersToProfile, saveCreatorProfile, LEVEL_LABELS, GOAL_LABELS, BLOCKER_LABELS, nichesLabel, NICHE_LABELS,
} from '../services/creatorProfile';
import { buildCreatorPlan } from '../services/creatorPlan';
import { useCreatorProfile } from '../services/creatorProfile';
import { formatCount } from '../utils/format';

interface RecommendationScreenProps {
  navigation: any;
  route: { params: { answers: Record<string, string[]> } };
}

const Chip = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.chip}>
    <Ionicons name={icon} size={14} color={OB.lilac} />
    <Text style={styles.chipText}>{text}</Text>
  </View>
);

export default function RecommendationScreen({ navigation, route }: RecommendationScreenProps) {
  const answers = route.params?.answers ?? {};
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const profile = useMemo(() => answersToProfile(answers), [answers]);
  const plan = useMemo(() => buildCreatorPlan(profile), [profile]);
  const name = (profile.name ?? '').split(/\s+/)[0];
  const niche = NICHE_LABELS[profile.niches?.[0] ?? ''];

  const loggedIn = !!user;
  const { status, completeProfile } = useSession();
  const { profile: stored } = useCreatorProfile();
  const tk = profile.tiktok && stored?.tiktokPreview?.handle === profile.tiktok ? stored.tiktokPreview : null;

  const onContinue = async () => {
    if (!loggedIn) {
      navigation.navigate('Login', { answers });
      return;
    }
    setSaving(true);
    // Compte sans profil qui termine son questionnaire : la session ouvre l'accueil (puis Premium)
    if (status === 'needsProfile') {
      await completeProfile(answers);
      return;
    }
    // Profil modifié depuis l'app : on enregistre et on revient à l'accueil
    await saveCreatorProfile(profile, user!.uid).catch(() => {});
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  return (
    <OnboardingShell
      contentStyle={{ paddingHorizontal: 0 }}
      footer={
        <>
          <PrimaryButton
            label={loggedIn ? 'C’est parti' : 'Sauvegarder mon plan'}
            onPress={onContinue}
            loading={saving}
            icon={<ArrowRight size={20} color="#FFF" />}
          />
          <Text style={styles.reassure}>Gratuit · ton plan et ton calendrier sont gardés dans ton compte</Text>
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
          <View style={styles.readyPill}>
            <Sparkles size={14} color="#42FFB0" />
            <Text style={styles.readyText}>Ton plan est prêt</Text>
          </View>
          <Text style={styles.title}>
            {name ? `${name}, voici ` : 'Voici '}
            <Text style={{ color: OB.pink }}>{plan.headline.replace(/^Ton/, 'ton')}</Text>
          </Text>
          <Text style={styles.intro}>{plan.intro}</Text>

          <View style={styles.chips}>
            {profile.level ? <Chip icon="person-outline" text={LEVEL_LABELS[profile.level] ?? profile.level} /> : null}
            {profile.niches?.length ? <Chip icon="videocam-outline" text={nichesLabel(profile.niches)} /> : null}
            {profile.goal ? <Chip icon="flag-outline" text={GOAL_LABELS[profile.goal] ?? profile.goal} /> : null}
          </View>
        </MotiView>

        {/* Compte TikTok trouvé pendant le questionnaire */}
        {tk ? (
          <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 120 }}>
            <LinearGradient colors={['#FF4FF9', '#B53CFF', '#7B1FE0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tk}>
              <View style={styles.tkHead}>
                {tk.avatar ? <Image source={{ uri: tk.avatar }} style={styles.tkAvatar} /> : <View style={[styles.tkAvatar, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.tkName} numberOfLines={1}>{tk.nickname}</Text>
                  <Text style={styles.tkHandle}>@{tk.handle}</Text>
                </View>
                <View style={styles.tkBadge}><Text style={styles.tkBadgeText}>Compte relié</Text></View>
              </View>
              <View style={styles.tkStats}>
                {[{ v: tk.followers, l: 'abonnés' }, { v: tk.likes, l: 'j’aime' }, { v: tk.videoCount, l: 'vidéos' }].map((x) => (
                  <View key={x.l} style={styles.tkStat}>
                    <Text style={styles.tkValue}>{formatCount(x.v)}</Text>
                    <Text style={styles.tkLabel}>{x.l}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.tkText}>
                {loggedIn
                  ? 'L’IA va étudier tes vidéos : ton bilan complet t’attend sur l’accueil.'
                  : 'L’IA est prête à étudier tes vidéos. Sauvegarde ton plan pour débloquer ton bilan complet.'}
              </Text>
            </LinearGradient>
          </MotiView>
        ) : null}

        {/* Priorités */}
        <Text style={styles.section}>Tes 3 priorités</Text>
        {plan.tips.map((t, i) => (
          <MotiView key={t.title} from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 150 + i * 120 }} style={[styles.tip, i === 0 && styles.tipFirst]}>
            <View style={[styles.tipIcon, { backgroundColor: `${t.color}22` }]}>
              <Ionicons name={t.icon as any} size={22} color={t.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTag, { color: t.color }]}>{t.tag}</Text>
              <Text style={styles.tipTitle}>{t.title}</Text>
              <Text style={styles.tipText}>{t.text}</Text>
              {i === 0 && profile.blocker ? (
                <Text style={styles.tipWhy}>Parce que tu as répondu : « {BLOCKER_LABELS[profile.blocker]} »</Text>
              ) : null}
            </View>
          </MotiView>
        ))}

        {/* Rythme */}
        <Text style={styles.section}>Ton rythme</Text>
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 550 }} style={styles.rhythm}>
          <View style={styles.rhythmHead}>
            <CalendarDays size={20} color="#4FC3FF" />
            <Text style={styles.rhythmTitle}>
              {plan.perWeek} vidéo{plan.perWeek > 1 ? 's' : ''} par semaine
            </Text>
          </View>
          <View style={styles.slots}>
            {plan.slots.map((s) => (
              <View key={s.day} style={styles.slot}>
                <Text style={styles.slotDay}>{s.day}</Text>
                <Text style={styles.slotHour}>{s.hour}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.rhythmNote}>On ajoute ces créneaux à ton calendrier, tu pourras les modifier.</Text>
        </MotiView>

        {/* Ce que Viraly fait pour toi */}
        <Text style={styles.section}>Ce que Viraly fait pour toi</Text>
        <LinearGradient colors={['rgba(255,79,249,0.14)', 'rgba(144,19,254,0.12)']} style={styles.viraly}>
          {[
            ...(profile.tiktok ? [{ Icon: Sparkles, color: '#42FFB0', text: `Le bilan de ton compte @${profile.tiktok}, chaque semaine` }] : []),
            { Icon: Flame, color: '#FFB84F', text: `Les tendances ${niche ?? 'de ta niche'} chaque semaine` },
            { Icon: Wand2, color: OB.pink, text: 'Un plan de tournage pour chaque tendance' },
            { Icon: ScanSearch, color: '#4FC3FF', text: 'Une vérification de ta vidéo avant de publier' },
          ].map(({ Icon, color, text }) => (
            <View key={text} style={styles.viralyRow}>
              <Icon size={18} color={color} />
              <Text style={styles.viralyText}>{text}</Text>
            </View>
          ))}
        </LinearGradient>
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  readyPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(66,255,176,0.12)', marginTop: 8 },
  readyText: { color: '#42FFB0', fontSize: 13, fontWeight: '800' },
  title: { color: '#FFF', fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 16, letterSpacing: -0.3 },
  intro: { color: OB.muted, fontSize: 16, lineHeight: 23, marginTop: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(179,113,255,0.12)', borderWidth: 1, borderColor: 'rgba(179,113,255,0.25)' },
  chipText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  tk: { borderRadius: 24, padding: 18, marginTop: 22, overflow: 'hidden' },
  tkHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tkAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#FFF' },
  tkName: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  tkHandle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  tkBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' },
  tkBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  tkStats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  tkStat: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.18)' },
  tkValue: { color: '#FFF', fontSize: 19, fontWeight: '900' },
  tkLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginTop: 1 },
  tkText: { color: '#FFF', fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: 14 },

  section: { color: '#FFF', fontSize: 19, fontWeight: '800', marginTop: 28, marginBottom: 12 },
  tip: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 22, backgroundColor: OB.card, borderWidth: 1, borderColor: OB.border, marginBottom: 10 },
  tipFirst: { borderColor: 'rgba(255,79,249,0.55)', backgroundColor: 'rgba(255,79,249,0.08)' },
  tipIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tipTag: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  tipTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 3 },
  tipText: { color: OB.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  tipWhy: { color: OB.faint, fontSize: 12, marginTop: 8, fontStyle: 'italic' },

  rhythm: { padding: 16, borderRadius: 22, backgroundColor: OB.card, borderWidth: 1, borderColor: OB.border },
  rhythmHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rhythmTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  slot: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(79,195,255,0.12)', borderWidth: 1, borderColor: 'rgba(79,195,255,0.3)' },
  slotDay: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  slotHour: { color: '#4FC3FF', fontSize: 12, fontWeight: '700', marginTop: 1 },
  rhythmNote: { color: OB.faint, fontSize: 13, marginTop: 12 },

  viraly: { padding: 16, borderRadius: 22, gap: 14, borderWidth: 1, borderColor: 'rgba(255,79,249,0.3)' },
  viralyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  viralyText: { color: '#FFF', fontSize: 15, fontWeight: '600', flex: 1 },

  reassure: { color: OB.faint, fontSize: 13, textAlign: 'center', marginTop: 12 },
});

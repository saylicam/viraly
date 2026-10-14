import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Linking,
  RefreshControl, ActivityIndicator, SafeAreaView, Alert, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  Flame, Music2, Eye, Lock, Rocket, Bell, Play, TrendingUp, Sparkles, Clapperboard,
  Hash, Heart, Wand2, Copy, Sprout, Mountain, TrendingDown, Info,
} from 'lucide-react-native';
import { apiService, resolveApiUrl } from '../services/api';
import { useUserProfile } from '../hooks/useUserProfile';
import { enableTrendNotifications, notificationsGranted } from '../services/notifications';
import { useTrendFavorites, type FavoriteItem } from '../hooks/useTrendFavorites';

// ---------- Types (réponse de GET /api/trends) ----------
export interface TrendVideo {
  id: string; author: string; authorName: string; views: number; likes: number;
  description: string; cover: string | null; url: string; market: 'US' | 'FR';
  soundTitle: string | null; hashtags?: string[];
}
export interface TrendSound {
  id: string; title: string; artist: string; cover: string | null; url: string;
  usageCount: number | null; growthPct: number | null;
  status: 'exploding' | 'rising' | 'new' | 'stable';
  stage?: 'emerging' | 'peak' | 'declining';
  appearances: number; totalViews: number; markets: ('US' | 'FR')[];
  notYetInFrance: boolean; topVideo: TrendVideo | null;
}
interface Preview { rank?: number; cover: string | null; views: number | null; market?: 'US' | 'FR' }
interface TrendHashtag { tag: string; videos: number; totalViews: number; markets: ('US' | 'FR')[]; generic: boolean }
interface TrendsData {
  weekId: string; collectedAt: string; niche: string; limited: boolean;
  sounds: TrendSound[]; notYetInFrance: TrendSound[]; videos: TrendVideo[]; formats: TrendVideo[];
  hashtags?: TrendHashtag[]; genericHashtags?: TrendHashtag[];
  /** Version gratuite : miniatures + vues des éléments cachés (affichées floutées) */
  previews?: { videos?: Preview[]; sounds?: Preview[]; ahead?: Preview[]; formats?: Preview[] };
  lockedCounts?: { sounds: number; videos: number; notYetInFrance: number; formats: number; hashtags?: number };
}

// Mêmes niches (et libellés) que le questionnaire
const NICHES = [
  { key: 'all', label: 'Tout' },
  { key: 'comedy', label: 'Comédie' },
  { key: 'music', label: 'Musique' },
  { key: 'beauty', label: 'Beauté' },
  { key: 'education', label: 'Éducation' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'tech', label: 'Tech' },
  { key: 'food', label: 'Cuisine' },
  { key: 'travel', label: 'Voyages' },
];
const FAVORITES_KEY = 'favorites';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = Math.min(SCREEN_W * 0.68, 290);
const HERO_H = HERO_W * 1.5;

const PINK = '#FF4FF9';
const VIOLET = '#B371FF';
const CARD_BG = '#1B0730';
const CARD_BORDER = 'rgba(179, 113, 255, 0.35)';

export const fmt = (n?: number | null) => {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} Md`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.', ',')} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(n);
};

const updatedLabel = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

const open = (url?: string | null) => {
  if (!url) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  Linking.openURL(url).catch(() => Alert.alert('Impossible d’ouvrir TikTok', 'Réessaie dans un instant.'));
};

// ---------- Petits composants ----------

const Flag = ({ market }: { market: 'US' | 'FR' }) => (
  <Text style={styles.flag}>{market === 'US' ? '🇺🇸' : '🇫🇷'}</Text>
);

/** Fenêtre de tir : où en est la tendance. */
const STAGES = {
  emerging: { label: 'Émergente · fonce', color: '#42FFB0', bg: 'rgba(66, 255, 176, 0.14)', Icon: Sprout },
  peak: { label: 'Au sommet · dernier moment', color: '#FFD84F', bg: 'rgba(255, 216, 79, 0.14)', Icon: Mountain },
  declining: { label: 'En déclin', color: '#A1A1AA', bg: 'rgba(161, 161, 170, 0.14)', Icon: TrendingDown },
} as const;

const StageBadge = ({ stage }: { stage?: TrendSound['stage'] }) => {
  if (!stage) return null;
  const s = STAGES[stage];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <s.Icon size={11} color={s.color} />
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
};

const GrowthBadge = ({ sound }: { sound: TrendSound }) => {
  if (sound.growthPct == null || sound.growthPct <= 0) return null;
  const hot = sound.status === 'exploding';
  return hot ? (
    <LinearGradient colors={['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
      <Flame size={11} color="#FFF" />
      <Text style={styles.badgeText}>+{sound.growthPct} %</Text>
    </LinearGradient>
  ) : (
    <View style={[styles.badge, { backgroundColor: 'rgba(66, 255, 176, 0.15)' }]}>
      <TrendingUp size={11} color="#42FFB0" />
      <Text style={[styles.badgeText, { color: '#42FFB0' }]}>+{sound.growthPct} %</Text>
    </View>
  );
};

const Cover = ({ uri, size, radius = 14 }: { uri: string | null; size: number; radius?: number }) => {
  const src = resolveApiUrl(uri);
  if (src) return <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: radius, backgroundColor: '#2A0F45' }} />;
  return (
    <LinearGradient colors={['#7B33F7', '#FF4FF9']} style={{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }}>
      <Music2 size={size * 0.42} color="#FFF" />
    </LinearGradient>
  );
};

const SectionTitle = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleRow}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

const HeartButton = ({ active, onPress, size = 18, floating = false }: { active: boolean; onPress: () => void; size?: number; floating?: boolean }) => (
  <TouchableOpacity
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
    style={floating ? styles.heartFloating : styles.heartInline}
  >
    <Heart size={size} color={active ? PINK : '#FFFFFF'} fill={active ? PINK : 'transparent'} strokeWidth={2.2} />
  </TouchableOpacity>
);

/** Grande carte vidéo (en tête d'écran) : voir sur TikTok ou refaire la tendance. */
const HeroVideoCard = ({ video, onRemix, fav, onFav }: { video: TrendVideo; onRemix: () => void; fav: boolean; onFav: () => void }) => {
  const src = resolveApiUrl(video.cover);
  return (
    <View style={styles.heroCard}>
      <TouchableOpacity activeOpacity={0.92} onPress={() => open(video.url)} style={StyleSheet.absoluteFillObject}>
        {src ? (
          <Image source={{ uri: src }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#3B1366', '#120424']} style={StyleSheet.absoluteFillObject} />
        )}
        <LinearGradient colors={['rgba(10,2,20,0.55)', 'rgba(10,2,20,0)', 'rgba(10,2,20,0)', 'rgba(10,2,20,0.95)']} locations={[0, 0.22, 0.5, 1]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.playBubble}><Play size={26} color="#FFF" fill="#FFF" /></View>
      </TouchableOpacity>
      <View style={styles.heroTop} pointerEvents="box-none">
        <View style={styles.viewsPill}>
          <Eye size={13} color="#FFF" />
          <Text style={styles.viewsText}>{fmt(video.views)} vues</Text>
          <Flag market={video.market} />
        </View>
        <HeartButton active={fav} onPress={onFav} floating />
      </View>
      <View style={styles.heroBottom} pointerEvents="box-none">
        <Text style={styles.heroAuthor} numberOfLines={1}>@{video.author}</Text>
        {video.description ? <Text style={styles.heroDesc} numberOfLines={2}>{video.description}</Text> : null}
        {video.soundTitle ? (
          <View style={styles.videoSoundRow}>
            <Music2 size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.heroSound} numberOfLines={1}>{video.soundTitle}</Text>
          </View>
        ) : null}
        <TouchableOpacity activeOpacity={0.9} onPress={onRemix} style={{ marginTop: 12 }}>
          <LinearGradient colors={['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.remixButton}>
            <Wand2 size={16} color="#FFF" />
            <Text style={styles.remixText}>Refaire à ma façon</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SoundRow = ({ sound, rank, onRemix, fav, onFav }: { sound: TrendSound; rank: number; onRemix: () => void; fav: boolean; onFav: () => void }) => (
  <TouchableOpacity activeOpacity={0.85} onPress={() => open(sound.url)} style={styles.soundCard}>
    <Text style={[styles.rank, rank <= 3 && { color: PINK }]}>{rank}</Text>
    <Cover uri={sound.cover} size={54} />
    <View style={styles.soundBody}>
      <View style={styles.soundTitleRow}>
        <Text style={styles.soundTitle} numberOfLines={1}>{sound.title}</Text>
        <HeartButton active={fav} onPress={onFav} size={17} />
      </View>
      <Text style={styles.soundArtist} numberOfLines={1}>{sound.artist || 'Artiste inconnu'}</Text>
      <View style={styles.soundMeta}>
        <StageBadge stage={sound.stage} />
        <GrowthBadge sound={sound} />
      </View>
      <View style={styles.soundMeta}>
        <Text style={styles.metaText}>{fmt(sound.usageCount)} vidéos</Text>
        <View style={styles.flags}>{sound.markets.map((m) => <Flag key={m} market={m} />)}</View>
        {sound.topVideo ? <Text style={styles.starLine} numberOfLines={1}>· ⭐ {fmt(sound.topVideo.views)} vues</Text> : null}
      </View>
      <TouchableOpacity onPress={onRemix} style={styles.remixInline} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Wand2 size={13} color={PINK} />
        <Text style={styles.remixInlineText}>Refaire avec ce son</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const AheadCard = ({ sound, onRemix }: { sound: TrendSound; onRemix: () => void }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={() => open(sound.url)} style={styles.aheadCard}>
    <Cover uri={sound.cover} size={64} radius={16} />
    <Text style={styles.aheadTitle} numberOfLines={2}>{sound.title}</Text>
    <Text style={styles.aheadArtist} numberOfLines={1}>{sound.artist || ' '}</Text>
    <View style={styles.aheadFooter}>
      <Flag market="US" />
      <Text style={styles.aheadStat}>{fmt(sound.totalViews)} vues</Text>
    </View>
    <TouchableOpacity onPress={onRemix} style={styles.aheadRemix}>
      <Wand2 size={13} color="#FFF" />
      <Text style={styles.aheadRemixText}>Refaire</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const VideoCard = ({ video, onRemix }: { video: TrendVideo; onRemix: () => void }) => {
  const src = resolveApiUrl(video.cover);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => open(video.url)} style={styles.videoCard}>
      {src ? (
        <Image source={{ uri: src }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#2A0F45', '#1B0730']} style={StyleSheet.absoluteFillObject} />
      )}
      <LinearGradient colors={['rgba(10,2,20,0)', 'rgba(10,2,20,0.92)']} style={styles.videoShade} />
      <View style={styles.videoTop}>
        <View style={styles.viewsPill}>
          <Eye size={12} color="#FFF" />
          <Text style={styles.viewsText}>{fmt(video.views)}</Text>
        </View>
        <Flag market={video.market} />
      </View>
      <View style={styles.videoBottom}>
        <Text style={styles.videoAuthor} numberOfLines={1}>@{video.author}</Text>
        <TouchableOpacity onPress={onRemix} style={styles.videoRemix}>
          <Wand2 size={12} color="#FFF" />
          <Text style={styles.videoRemixText}>Refaire</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

/** Son du haut du classement, flouté : on voit sa place et son succès, pas son nom. */
const LockedSoundRow = ({ preview, onUnlock }: { preview: Preview; onUnlock: () => void }) => {
  const src = resolveApiUrl(preview.cover);
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onUnlock} style={[styles.soundCard, styles.lockedSound]}>
      <Text style={[styles.rank, (preview.rank ?? 99) <= 3 && { color: PINK }]}>{preview.rank}</Text>
      <View style={styles.lockedSoundCover}>
        {src ? <Image source={{ uri: src }} style={StyleSheet.absoluteFillObject} blurRadius={14} /> : null}
        <View style={styles.lockedSoundLock}><Lock size={16} color="#FFF" /></View>
      </View>
      <View style={styles.soundBody}>
        <View style={styles.lockedLine} />
        <View style={[styles.lockedLine, { width: '45%', marginTop: 8 }]} />
        <View style={styles.soundMeta}>
          {preview.views ? <Text style={styles.metaText}>⭐ {fmt(preview.views)} vues</Text> : null}
          {preview.market ? <Flag market={preview.market} /> : null}
          <Text style={styles.lockedHint}>Débloquer</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/** Petite carte floutée (formats, sons en avance) : même principe que les vidéos stars. */
const LockedMiniCard = ({ preview, onUnlock, label }: { preview: Preview; onUnlock: () => void; label: string }) => {
  const src = resolveApiUrl(preview.cover);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onUnlock} style={styles.videoCard}>
      {src ? (
        <Image source={{ uri: src }} style={StyleSheet.absoluteFillObject} resizeMode="cover" blurRadius={18} />
      ) : <LinearGradient colors={['#3B1366', '#120424']} style={StyleSheet.absoluteFillObject} />}
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={styles.videoTop} pointerEvents="none">
        {preview.views ? (
          <View style={styles.viewsPill}><Eye size={11} color="#FFF" /><Text style={styles.viewsText}>{fmt(preview.views)}</Text></View>
        ) : <View />}
        {preview.market ? <Flag market={preview.market} /> : null}
      </View>
      <View style={styles.miniLock} pointerEvents="none">
        <View style={styles.miniLockIcon}><Lock size={18} color="#FFF" /></View>
        <Text style={styles.miniLockText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

/** Vraie vidéo de la semaine, floutée : on voit qu'elle existe (et ses vues), pas ce qu'elle contient. */
const LockedHeroCard = ({ preview, onUnlock }: { preview: Preview; onUnlock: () => void }) => {
  const src = resolveApiUrl(preview.cover);
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onUnlock} style={styles.heroCard}>
      {src ? (
        <Image source={{ uri: src }} style={StyleSheet.absoluteFillObject} resizeMode="cover" blurRadius={22} />
      ) : (
        <LinearGradient colors={['#3B1366', '#120424']} style={StyleSheet.absoluteFillObject} />
      )}
      <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={styles.heroTop} pointerEvents="none">
        {preview.views ? (
          <View style={styles.viewsPill}>
            <Eye size={13} color="#FFF" />
            <Text style={styles.viewsText}>{fmt(preview.views)} vues</Text>
            {preview.market ? <Flag market={preview.market} /> : null}
          </View>
        ) : <View />}
      </View>
      <View style={styles.heroLockCenter} pointerEvents="none">
        <View style={styles.heroLockIcon}><Lock size={24} color="#FFF" /></View>
        <Text style={styles.heroLockTitle}>{preview.rank ? `N°${preview.rank} des vidéos stars` : 'Vidéo star de la semaine'}</Text>
        <Text style={styles.heroLockText}>Découvre-la et refais-la à ta façon</Text>
        <View style={styles.heroLockedBtn}><Text style={styles.heroLockedBtnText}>Débloquer</Text></View>
      </View>
    </TouchableOpacity>
  );
};

/** Bloc verrouillé : faux contenu flouté + pastille Premium (même style que l'analyse). */
const LockedBlock = ({ label, why, onUnlock, height = 150, previews }: { label: string; why?: string; onUnlock: () => void; height?: number; previews?: Preview[] }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onUnlock} style={[styles.lockedBlock, { height }]}>
    <View style={styles.lockedGhost}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.ghostRow}>
          {previews?.[i]?.cover ? (
            <Image source={{ uri: resolveApiUrl(previews[i].cover) as string }} style={styles.ghostCover} blurRadius={10} />
          ) : <View style={styles.ghostCover} />}
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.ghostLine, { width: '70%' }]} />
            <View style={[styles.ghostLine, { width: '40%' }]} />
          </View>
        </View>
      ))}
    </View>
    <BlurView intensity={30} tint="dark" style={styles.lockedOverlay}>
      {why ? <Text style={styles.lockWhy}>{why}</Text> : null}
      <View style={styles.lockPill}>
        <Lock size={14} color="#FFFFFF" />
        <Text style={styles.lockText}>{label}</Text>
      </View>
    </BlurView>
  </TouchableOpacity>
);

/** Hashtags du moment + mode d'emploi. */
const HashtagsBlock = ({ tags, generic, limited, lockedCount, onUnlock }: {
  tags: TrendHashtag[]; generic: TrendHashtag[]; limited: boolean; lockedCount: number; onUnlock: () => void;
}) => {
  const copy = async (text: string, label = 'Copié') => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(label, text);
  };
  // Combinaison conseillée : 2 de la niche + 2 tendance + 1 large
  const combo = [...tags.slice(0, 4).map((t) => t.tag), ...(generic[0] ? [generic[0].tag] : [])];
  return (
    <View>
      <View style={styles.tipCard}>
        <Info size={16} color={VIOLET} style={{ marginTop: 1 }} />
        <Text style={styles.tipText}>
          <Text style={styles.tipStrong}>Comment bien les utiliser : </Text>
          mets 3 à 5 hashtags. 1 ou 2 de ta niche pour être montré au bon public, 1 ou 2 tendance pour profiter de la vague, 1 large en bonus. Les hashtags trop larges (#fyp, #pourtoi) ne suffisent jamais seuls.
        </Text>
      </View>
      <View style={styles.tagsWrap}>
        {tags.map((t, i) => (
          <TouchableOpacity key={t.tag} activeOpacity={0.85} onPress={() => copy(`#${t.tag}`, 'Hashtag copié')} style={[styles.tagChip, i < 3 && styles.tagChipHot]}>
            <Text style={styles.tagText}>#{t.tag}</Text>
            <Text style={styles.tagCount}>{t.videos} vidéos · {fmt(t.totalViews)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {limited && lockedCount > 0 ? (
        <LockedBlock
          label={`Voir les ${lockedCount} hashtags`}
          why="Ceux qui ramènent des vues dans ta niche cette semaine"
          onUnlock={onUnlock}
          height={110}
        />
      ) : null}
      {!limited && combo.length >= 3 ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => copy(combo.map((t) => `#${t}`).join(' '), 'Combinaison copiée')} style={styles.comboButton}>
          <Copy size={15} color="#FFF" />
          <Text style={styles.comboText} numberOfLines={1}>Copier le combo conseillé : {combo.map((t) => `#${t}`).join(' ')}</Text>
        </TouchableOpacity>
      ) : null}
      {generic.length ? (
        <Text style={styles.genericText}>
          Hashtags larges les plus utilisés : {generic.map((g) => `#${g.tag}`).join('  ')}
        </Text>
      ) : null}
    </View>
  );
};

const PREMIUM_PITCH = 'Avec Premium : toutes les tendances, et tu adaptes tes vidéos à ton contenu';

/** Bandeau de la version gratuite : ce qu'on voit, et ce que Premium débloque. */
const PremiumTrendsBanner = ({ onUnlock }: { onUnlock: () => void }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onUnlock} style={styles.pitchWrap}>
    <LinearGradient colors={['rgba(255,79,249,0.22)', 'rgba(144,19,254,0.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pitch}>
      <View style={styles.pitchIcon}><Lock size={18} color="#FFF" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.pitchTitle}>Tu vois 2 sons et 1 vidéo sur toute la sélection</Text>
        <Text style={styles.pitchText}>{PREMIUM_PITCH}.</Text>
      </View>
      <View style={styles.pitchBtn}><Text style={styles.pitchBtnText}>Débloquer</Text></View>
    </LinearGradient>
  </TouchableOpacity>
);

// ---------- Écran ----------

export default function TrendsScreen({ navigation }: any) {
  const { profileData } = useUserProfile();
  const userNiche: string | undefined = Array.isArray(profileData?.niches) ? profileData.niches[0] : undefined;
  const userLevel: string | undefined = profileData?.level ?? undefined;
  const [niche, setNiche] = useState<string>('all');
  const [nicheTouched, setNicheTouched] = useState(false);
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifOn, setNotifOn] = useState<boolean | null>(null);
  const { favorites, isFavorite, toggleFavorite } = useTrendFavorites();

  // Par défaut : la niche principale du créateur
  useEffect(() => {
    if (!nicheTouched && userNiche && NICHES.some((n) => n.key === userNiche)) setNiche(userNiche);
  }, [userNiche, nicheTouched]);

  useEffect(() => { notificationsGranted().then(setNotifOn).catch(() => setNotifOn(false)); }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (niche === FAVORITES_KEY) { setLoading(false); return; }
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const res = await apiService.getTrends(niche);
    if (res.success) {
      setData((res.data as any)?.data ?? null);
    } else {
      setError(res.error || 'Impossible de charger les tendances.');
    }
    isRefresh ? setRefreshing(false) : setLoading(false);
  }, [niche]);

  useEffect(() => { load(); }, [load]);

  const openPaywall = () => navigation.navigate('Paywall');

  const remix = (kind: 'sound' | 'video', item: TrendSound | TrendVideo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isSound = kind === 'sound';
    navigation.navigate('TrendPlan', {
      kind,
      id: item.id,
      title: isSound ? (item as TrendSound).title : `@${(item as TrendVideo).author}`,
      subtitle: isSound ? (item as TrendSound).artist : (item as TrendVideo).soundTitle,
      cover: item.cover,
      url: item.url,
      stage: isSound ? (item as TrendSound).stage : undefined,
      niche: niche !== 'all' && niche !== FAVORITES_KEY ? niche : userNiche,
      level: userLevel,
    });
  };

  const favVideo = (v: TrendVideo): FavoriteItem => ({ kind: 'video', id: v.id, title: `@${v.author}`, subtitle: v.soundTitle ?? '', cover: v.cover, url: v.url, views: v.views, savedAt: Date.now() });
  const favSound = (s: TrendSound): FavoriteItem => ({ kind: 'sound', id: s.id, title: s.title, subtitle: s.artist, cover: s.cover, url: s.url, views: s.topVideo?.views ?? s.totalViews, savedAt: Date.now() });

  const askNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await enableTrendNotifications();
    if (result === 'granted') {
      setNotifOn(true);
      Alert.alert('C’est noté 🔔', 'Tu recevras chaque semaine les sons et tendances qui explosent dans ta niche.');
    } else if (result === 'denied') {
      Alert.alert('Notifications désactivées', 'Active-les dans Réglages > Viraly > Notifications pour recevoir les tendances.');
    } else {
      Alert.alert('Oups', 'Impossible d’activer les notifications pour le moment.');
    }
  };

  const limited = data?.limited === true;
  const nicheLabel = useMemo(() => NICHES.find((n) => n.key === niche)?.label ?? 'Tout', [niche]);
  const showingFavorites = niche === FAVORITES_KEY;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={VIOLET} />}
      >
        {/* Titre */}
        <View style={styles.titleContainer}>
          <Text style={styles.titlePrefix}>Tendances</Text>
          <View style={styles.titleCapsule}>
            <Flame size={26} color="#FFFFFF" strokeWidth={2.6} />
          </View>
        </View>
        <Text style={styles.subtitle}>
          Ce qui explose cette semaine{data?.collectedAt ? ` · mis à jour le ${updatedLabel(data.collectedAt)}` : ''}
        </Text>

        {/* Niches + favoris */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
          {[{ key: FAVORITES_KEY, label: `♥ Favoris${favorites.length ? ` (${favorites.length})` : ''}` }, ...NICHES].map((n) => {
            const active = n.key === niche;
            return (
              <TouchableOpacity
                key={n.key}
                activeOpacity={0.85}
                onPress={() => { Haptics.selectionAsync(); setNicheTouched(true); setNiche(n.key); }}
              >
                {active ? (
                  <LinearGradient colors={['#FF4FF9', '#9013FE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chip}>
                    <Text style={[styles.chipText, { color: '#FFF' }]}>{n.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.chip, styles.chipIdle]}>
                    <Text style={styles.chipText}>{n.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {showingFavorites ? (
          favorites.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>♥</Text>
              <Text style={styles.emptyTitle}>Aucun favori pour l’instant</Text>
              <Text style={styles.emptyText}>Appuie sur le cœur d’une vidéo ou d’un son pour le retrouver ici.</Text>
            </View>
          ) : (
            <View style={{ marginTop: 22 }}>
              {favorites.map((f) => (
                <TouchableOpacity key={`${f.kind}_${f.id}`} activeOpacity={0.85} onPress={() => open(f.url)} style={styles.soundCard}>
                  <Cover uri={f.cover} size={54} />
                  <View style={styles.soundBody}>
                    <View style={styles.soundTitleRow}>
                      <Text style={styles.soundTitle} numberOfLines={1}>{f.title}</Text>
                      <HeartButton active onPress={() => toggleFavorite(f)} size={17} />
                    </View>
                    <Text style={styles.soundArtist} numberOfLines={1}>{f.kind === 'sound' ? '🎵 Son' : '🎬 Vidéo'}{f.subtitle ? ` · ${f.subtitle}` : ''}</Text>
                    <Text style={styles.metaText}>{fmt(f.views)} vues</Text>
                    <TouchableOpacity onPress={() => remix(f.kind, { id: f.id, title: f.title, artist: f.subtitle, author: f.title.replace(/^@/, ''), cover: f.cover, url: f.url, soundTitle: f.subtitle } as any)} style={styles.remixInline}>
                      <Wand2 size={13} color={PINK} />
                      <Text style={styles.remixInlineText}>Refaire à ma façon</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : loading ? (
          <View style={styles.center}><ActivityIndicator color={VIOLET} size="large" /></View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Connexion impossible</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={() => load()} style={styles.retry}><Text style={styles.retryText}>Réessayer</Text></TouchableOpacity>
          </View>
        ) : !data || data.sounds.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📡</Text>
            <Text style={styles.emptyTitle}>Les tendances arrivent bientôt</Text>
            <Text style={styles.emptyText}>Chaque semaine, Viraly repère les sons et vidéos qui explosent aux États-Unis et en France.</Text>
          </View>
        ) : (
          <>
            {limited ? <PremiumTrendsBanner onUnlock={openPaywall} /> : null}

            {/* 1. Vidéos stars, en grand */}
            <SectionTitle icon={<Flame size={20} color="#FFD84F" />} title="Vidéos stars" subtitle="Les plus vues de la semaine. Inspire-toi, puis refais-la à ta façon." />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={HERO_W + 14}
              decelerationRate="fast"
              style={styles.heroScroll}
              contentContainerStyle={styles.heroList}
            >
              {/* Version gratuite : les meilleures places d'abord, floutées */}
              {limited && data.previews?.videos?.length
                ? data.previews.videos.map((p, i) => <LockedHeroCard key={`lock${i}`} preview={p} onUnlock={openPaywall} />)
                : null}
              {data.videos.map((v, i) => (
                <MotiView key={v.id} from={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i, 3) * 80 }}>
                  <HeroVideoCard video={v} onRemix={() => remix('video', v)} fav={isFavorite('video', v.id)} onFav={() => toggleFavorite(favVideo(v))} />
                </MotiView>
              ))}
              {limited && !data.previews?.videos?.length && (data.lockedCounts?.videos ?? 0) > 0 ? (
                <TouchableOpacity activeOpacity={0.9} onPress={openPaywall} style={[styles.heroCard, styles.heroLocked]}>
                  <Lock size={28} color="#FFF" />
                  <Text style={styles.heroLockedTitle}>+{data.lockedCounts!.videos} vidéos stars</Text>
                  <Text style={styles.heroLockedSub}>Les plus vues de la semaine, avec un plan pour les refaire à ta façon</Text>
                  <View style={styles.heroLockedBtn}><Text style={styles.heroLockedBtnText}>Les débloquer</Text></View>
                </TouchableOpacity>
              ) : null}
            </ScrollView>

            {/* 2. Pas encore en France */}
            <SectionTitle icon={<Rocket size={20} color={PINK} />} title="Prends de l’avance" subtitle="Ça cartonne aux États-Unis, pas encore en France" />
            {limited && data.previews?.ahead?.length ? (
              <>
                <Text style={styles.lockedSectionWhy}>Sois parmi les premiers en France à les utiliser : c’est là que les vues sont les plus faciles.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hList}>
                  {data.previews.ahead.map((p, i) => <LockedMiniCard key={`ahead${i}`} preview={p} label="Son en avance" onUnlock={openPaywall} />)}
                </ScrollView>
              </>
            ) : limited ? (
              <LockedBlock
                label="Prendre de l’avance"
                why="Ils explosent aux États-Unis et pas encore en France : sois parmi les premiers à les utiliser."
                onUnlock={openPaywall}
                height={130}
              />
            ) : data.notYetInFrance.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hList}>
                {data.notYetInFrance.map((s) => <AheadCard key={s.id} sound={s} onRemix={() => remix('sound', s)} />)}
              </ScrollView>
            ) : (
              <Text style={styles.noneText}>Rien de nouveau venu des US cette semaine en {nicheLabel.toLowerCase()}.</Text>
            )}

            {/* 3. Top sons */}
            <SectionTitle icon={<Music2 size={20} color={VIOLET} />} title="Top sons de la semaine" subtitle="La fenêtre de tir t’indique s’il est encore temps d’y aller" />
            {limited && data.previews?.sounds?.length ? (
              <>
                <TouchableOpacity activeOpacity={0.9} onPress={openPaywall} style={styles.topLockBanner}>
                  <Lock size={14} color="#FFF" />
                  <Text style={styles.topLockText}>Le top {data.previews.sounds.length} de la semaine est réservé à Premium : poste avant que ces sons soient saturés.</Text>
                </TouchableOpacity>
                {data.previews.sounds.map((p, i) => <LockedSoundRow key={`ls${i}`} preview={p} onUnlock={openPaywall} />)}
              </>
            ) : null}
            {data.sounds.map((s, i) => (
              <MotiView key={s.id} from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: Math.min(i, 6) * 60 }}>
                <SoundRow sound={s} rank={(s as any).rank ?? i + 1} onRemix={() => remix('sound', s)} fav={isFavorite('sound', s.id)} onFav={() => toggleFavorite(favSound(s))} />
              </MotiView>
            ))}

            {/* 4. Hashtags */}
            {(data.hashtags?.length ?? 0) > 0 || (limited && (data.lockedCounts?.hashtags ?? 0) > 0) ? (
              <>
                <SectionTitle icon={<Hash size={20} color="#4FC3FF" />} title="Hashtags du moment" subtitle="Ceux qui reviennent dans les vidéos qui cartonnent. Appuie pour copier." />
                <HashtagsBlock
                  tags={data.hashtags ?? []}
                  generic={data.genericHashtags ?? []}
                  limited={limited}
                  lockedCount={data.lockedCounts?.hashtags ?? 0}
                  onUnlock={openPaywall}
                />
              </>
            ) : null}

            {/* 5. Formats qui cartonnent (sons originaux) */}
            <SectionTitle icon={<Clapperboard size={20} color="#4FC3FF" />} title="Formats qui cartonnent" subtitle="Des idées de vidéos qui marchent en ce moment" />
            {limited && data.previews?.formats?.length ? (
              <>
                <Text style={styles.lockedSectionWhy}>Des idées de vidéos qui marchent en ce moment, prêtes à tourner, même sans son tendance.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hList}>
                  {data.previews.formats.map((p, i) => <LockedMiniCard key={`fmt${i}`} preview={p} label="Format qui cartonne" onUnlock={openPaywall} />)}
                </ScrollView>
              </>
            ) : limited ? (
              <LockedBlock label="Voir les formats" why="Des idées de vidéos qui marchent en ce moment, prêtes à tourner." onUnlock={openPaywall} height={130} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll} contentContainerStyle={styles.hList}>
                {data.formats.map((v) => <VideoCard key={v.id} video={v} onRemix={() => remix('video', v)} />)}
              </ScrollView>
            )}
          </>
        )}

        {/* Notifications */}
        {notifOn === false ? (
          <TouchableOpacity activeOpacity={0.9} onPress={askNotifications} style={styles.notifCard}>
            <LinearGradient colors={['rgba(255,79,249,0.18)', 'rgba(144,19,254,0.18)']} style={styles.notifGradient}>
              <View style={styles.notifIcon}><Bell size={20} color="#FFF" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>Ne rate plus une tendance</Text>
                <Text style={styles.notifText}>Reçois chaque semaine les sons qui explosent dans ta niche.</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0214' },
  scroll: { flex: 1, backgroundColor: '#0A0214' },
  scrollContent: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 120 },

  titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  titlePrefix: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  titleCapsule: { backgroundColor: PINK, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  subtitle: { fontSize: 15, color: '#EAEAEA', opacity: 0.85, lineHeight: 22 },

  chipsScroll: { marginTop: 18, marginHorizontal: -22 },
  chips: { paddingHorizontal: 22, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 },
  chipIdle: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  chipText: { fontSize: 14, fontWeight: '700', color: '#D9C8F5' },

  sectionHeader: { marginTop: 30, marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  sectionSubtitle: { fontSize: 13, color: '#A1A1AA', marginTop: 4, lineHeight: 18 },

  // Grandes cartes vidéo
  heroScroll: { marginHorizontal: -22 },
  heroList: { paddingHorizontal: 22, gap: 14 },
  heroCard: {
    width: HERO_W, height: HERO_H, borderRadius: 26, overflow: 'hidden', backgroundColor: CARD_BG,
    borderWidth: 1.4, borderColor: 'rgba(255, 79, 249, 0.4)',
  },
  playBubble: {
    position: 'absolute', top: '38%', alignSelf: 'center', width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(10,2,20,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center', paddingLeft: 4,
  },
  heroTop: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroBottom: { position: 'absolute', left: 14, right: 14, bottom: 14 },
  heroAuthor: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  heroDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, lineHeight: 18 },
  heroSound: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  heroLocked: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, backgroundColor: 'rgba(144, 19, 254, 0.22)' },
  heroLockedTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  heroLockedSub: { color: '#D9C8F5', fontSize: 13, textAlign: 'center' },
  remixButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderRadius: 999 },
  remixText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  heartFloating: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(10,2,20,0.55)', alignItems: 'center', justifyContent: 'center' },
  heartInline: { paddingLeft: 8 },

  soundCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: 22, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: CARD_BORDER,
    shadowColor: '#7B33F7', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  rank: { width: 26, fontSize: 18, fontWeight: '800', color: '#71717A', textAlign: 'center', marginRight: 8 },
  soundBody: { flex: 1, marginLeft: 12 },
  soundTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soundTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  soundArtist: { fontSize: 13, color: '#A1A1AA', marginTop: 2 },
  soundMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: '#D9C8F5', fontWeight: '600' },
  flags: { flexDirection: 'row', gap: 2 },
  flag: { fontSize: 13 },
  starLine: { flexShrink: 1, fontSize: 12, color: '#EAEAEA', opacity: 0.8 },
  remixInline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start' },
  remixInlineText: { color: PINK, fontSize: 13, fontWeight: '800' },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },

  hScroll: { marginHorizontal: -22 },
  hList: { gap: 12, paddingHorizontal: 22 },
  aheadCard: {
    width: 156, padding: 14, borderRadius: 22, backgroundColor: CARD_BG,
    borderWidth: 1.4, borderColor: 'rgba(255, 79, 249, 0.45)',
    shadowColor: PINK, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  aheadTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 12, minHeight: 36 },
  aheadArtist: { fontSize: 12, color: '#A1A1AA', marginTop: 2 },
  aheadFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  aheadStat: { fontSize: 12, fontWeight: '700', color: '#D9C8F5' },
  aheadRemix: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255, 79, 249, 0.25)' },
  aheadRemixText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  videoCard: {
    width: 138, height: 230, borderRadius: 20, overflow: 'hidden', backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: CARD_BORDER,
  },
  videoShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  videoTop: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewsPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(10,2,20,0.65)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  viewsText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  videoBottom: { position: 'absolute', left: 10, right: 10, bottom: 12 },
  videoAuthor: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  videoSoundRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  videoRemix: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255, 79, 249, 0.45)' },
  videoRemixText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  tipCard: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 18, backgroundColor: 'rgba(179, 113, 255, 0.10)', borderWidth: 1, borderColor: 'rgba(179, 113, 255, 0.25)', marginBottom: 14 },
  tipText: { flex: 1, color: '#EAEAEA', fontSize: 13, lineHeight: 19 },
  tipStrong: { fontWeight: '800', color: '#FFF' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER },
  tagChipHot: { borderColor: 'rgba(255, 79, 249, 0.55)' },
  tagText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  tagCount: { color: '#A1A1AA', fontSize: 11, marginTop: 2 },
  comboButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(79, 195, 255, 0.16)', borderWidth: 1, borderColor: 'rgba(79, 195, 255, 0.4)' },
  comboText: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '700' },
  genericText: { color: '#71717A', fontSize: 12, marginTop: 10, lineHeight: 17 },

  pitchWrap: { marginTop: 20 },
  pitch: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 79, 249, 0.45)' },
  pitchIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(144, 19, 254, 0.75)', alignItems: 'center', justifyContent: 'center' },
  pitchTitle: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  pitchText: { color: '#EAD9FF', fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  pitchBtn: { backgroundColor: '#FF4FF9', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  pitchBtnText: { color: '#FFF', fontSize: 12.5, fontWeight: '900' },
  lockedSound: { opacity: 0.95, borderColor: 'rgba(255,79,249,0.35)' },
  lockedSoundCover: { width: 54, height: 54, borderRadius: 14, overflow: 'hidden', backgroundColor: 'rgba(179,113,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  lockedSoundLock: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(144,19,254,0.85)' },
  lockedLine: { height: 10, width: '75%', borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.16)' },
  lockedHint: { color: PINK, fontSize: 12, fontWeight: '900' },
  topLockBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, marginBottom: 12, backgroundColor: 'rgba(144,19,254,0.35)', borderWidth: 1, borderColor: 'rgba(255,79,249,0.45)' },
  topLockText: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  lockedSectionWhy: { color: '#D9C8F5', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  miniLock: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 10 },
  miniLockIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(144,19,254,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  miniLockText: { color: '#FFF', fontSize: 12.5, fontWeight: '900', textAlign: 'center' },
  lockWhy: { color: '#FFF', fontSize: 13, fontWeight: '700', textAlign: 'center', paddingHorizontal: 18, marginBottom: 10, lineHeight: 18 },
  heroLockCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 6 },
  heroLockIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(144,19,254,0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', marginBottom: 4 },
  heroLockTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  heroLockText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center' },
  heroLockedBtn: { marginTop: 6, backgroundColor: '#FF4FF9', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  heroLockedBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  lockedBlock: { borderRadius: 22, overflow: 'hidden', backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, marginBottom: 12 },
  lockedGhost: { padding: 14, gap: 14 },
  ghostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ghostCover: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(179,113,255,0.35)', overflow: 'hidden' },
  ghostLine: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.18)' },
  lockedOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(13, 0, 23, 0.25)' },
  lockPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(144, 19, 254, 0.75)' },
  lockText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  center: { paddingVertical: 60, alignItems: 'center' },
  emptyCard: { marginTop: 30, padding: 24, borderRadius: 24, backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, alignItems: 'center' },
  emptyEmoji: { fontSize: 36, marginBottom: 10, color: PINK },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#A1A1AA', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  retry: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(144, 19, 254, 0.5)' },
  retryText: { color: '#FFF', fontWeight: '700' },
  noneText: { fontSize: 14, color: '#A1A1AA' },

  notifCard: { marginTop: 30, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 79, 249, 0.45)' },
  notifGradient: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  notifIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255, 79, 249, 0.35)', alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  notifText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 18 },
});

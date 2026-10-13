import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { loadLocalProfile, saveCreatorProfile } from './creatorProfile';

/**
 * Bilan du compte TikTok (@pseudo) : gardé sur le téléphone, avec un historique
 * quotidien des chiffres clés pour montrer la progression semaine après semaine.
 */

export interface AccountVideo {
  id: string; url: string; description: string; createdAt: number; duration: number;
  views: number; likes: number; comments: number; shares: number; saves: number; engagement: number;
  cover: string | null; pinned: boolean;
}

export interface AccountAudit {
  version: 1;
  handle: string;
  generatedAt: string;
  limited?: boolean;
  profile: { handle: string; nickname: string; avatar: string | null; bio: string; verified: boolean; followers: number; following: number; likes: number; videoCount: number };
  stats: {
    analysedVideos: number; avgViews: number; medianViews: number; avgLikes: number;
    engagementRate: number; engagementBenchmark: number; viewsPerFollower: number;
    postsPerWeek: number; daysSinceLastPost: number | null; avgDuration: number; hitRate: number; momentum: number;
    bestDays: { day: string; medianViews: number; posts: number }[];
    bestHours: { slot: string; medianViews: number; posts: number }[];
    weekdayChart: { day: string; value: number }[];
    viewsSeries: { id: string; views: number; createdAt: number }[];
    durationInsight: { short: number | null; long: number | null };
  };
  score: { total: number; parts: { key: string; label: string; value: number }[] };
  videos: AccountVideo[];
  topVideos: AccountVideo[];
  insights: {
    titre: string; resume: string; niveau: string; niche_detectee: string; style: string; ton: string; public: string;
    points_forts: { titre: string; detail: string }[];
    points_faibles: { titre: string; detail: string; solution: string }[];
    formats_gagnants: { titre: string; pourquoi: string; video_id: string }[];
    meilleure_video: { id: string; pourquoi: string };
    video_a_retravailler: { id: string; pourquoi: string; comment: string };
    conseil_principal: { titre: string; action: string };
    plan_semaine: { jour: string; idee: string; format: string; accroche: string }[];
    objectif_30_jours: string;
    accroches_qui_marchent: string[];
    a_eviter: string[];
    duree_ideale: string;
  };
  card: Record<string, any>;
}

export interface AuditSnapshot { date: string; followers: number; likes: number; medianViews: number; score: number; engagement: number }

const KEY = '@viraly_account_audit';
const HISTORY_KEY = '@viraly_account_history';

let state: { audit: AccountAudit | null; history: AuditSnapshot[] } = { audit: null, history: [] };
let loaded = false;
const listeners = new Set<(s: typeof state) => void>();
const emit = (next: typeof state) => {
  state = next;
  listeners.forEach((l) => l(state));
};

const load = async () => {
  if (loaded) return state;
  try {
    const [a, h] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(HISTORY_KEY)]);
    state = { audit: a ? JSON.parse(a) : null, history: h ? JSON.parse(h) : [] };
  } catch {
    state = { audit: null, history: [] };
  }
  loaded = true;
  return state;
};

export const clearAccountAudit = async () => {
  emit({ audit: null, history: [] });
  await AsyncStorage.multiRemove([KEY, HISTORY_KEY]).catch(() => {});
};

const recordSnapshot = (history: AuditSnapshot[], a: AccountAudit) => {
  const date = new Date().toISOString().slice(0, 10);
  const snap: AuditSnapshot = {
    date, followers: a.profile.followers, likes: a.profile.likes, medianViews: a.stats.medianViews,
    score: a.score.total, engagement: a.stats.engagementRate,
  };
  // Une seule entrée par jour
  return [...history.filter((h) => h.date !== date), snap].slice(-60);
};

/** Évolution depuis le bilan précédent (autre jour). */
export const progressSince = (history: AuditSnapshot[]) => {
  if (history.length < 2) return null;
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  return { since: prev.date, followers: last.followers - prev.followers, score: last.score - prev.score, medianViews: last.medianViews - prev.medianViews };
};

export const runAccountAudit = async (opts: { refresh?: boolean; uid?: string | null } = {}) => {
  const profile = await loadLocalProfile();
  const handle = profile?.tiktok;
  if (!handle) return { success: false as const, error: 'Ajoute ton @ TikTok pour recevoir ton bilan.', code: 'NO_HANDLE' };
  const res = await apiService.auditTikTok({ handle, niche: profile?.niches?.[0], goal: profile?.goal, refresh: opts.refresh });
  if (!res.success || !res.data) return { success: false as const, error: res.error ?? 'Bilan indisponible.', code: res.code };

  const audit = res.data as AccountAudit;
  const current = await load();
  const history = recordSnapshot(current.audit && current.audit.handle !== audit.handle ? [] : current.history, audit);
  emit({ audit, history });
  await AsyncStorage.multiSet([[KEY, JSON.stringify(audit)], [HISTORY_KEY, JSON.stringify(history)]]).catch(() => {});

  // La fiche créateur rejoint le profil : toutes les fonctions IA s'en servent ensuite
  await saveCreatorProfile({
    creatorCard: audit.card,
    tiktokPreview: {
      handle: audit.profile.handle, nickname: audit.profile.nickname, avatar: audit.profile.avatar,
      verified: audit.profile.verified, followers: audit.profile.followers, likes: audit.profile.likes, videoCount: audit.profile.videoCount,
    },
  }, opts.uid ?? null).catch(() => {});
  return { success: true as const, audit };
};

/** Le bilan affiché doit correspondre au compte enregistré dans le profil. */
export const useAccountAudit = (handle?: string | null) => {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    load().then(setS);
    return () => { listeners.delete(setS); };
  }, []);
  const audit = s.audit && handle && s.audit.handle === handle ? s.audit : null;
  const reload = useCallback(() => load().then(setS), []);
  return { audit, history: audit ? s.history : [], reload };
};

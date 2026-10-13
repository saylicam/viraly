import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from './firestoreWrapper';
import { db } from '../../firebase';
import { useAuth } from '../hooks/useAuth';
import { renameAiPublishTasks } from './calendarService';

/**
 * Profil du créateur (réponses du questionnaire + prénom), utilisé dans toute l'app :
 * accueil, plan personnalisé, tendances, conseils.
 * Gardé sur le téléphone (accès instantané) et dans Firestore (le compte fait foi).
 */

export interface CreatorProfile {
  name?: string;
  level?: string;
  niches?: string[];
  goal?: string;
  blocker?: string;
  frequency?: string;
  calendarSeeded?: boolean;
  /** Pseudo TikTok sans @ (facultatif) */
  tiktok?: string;
  /** Aperçu du compte TikTok vu pendant l'inscription */
  tiktokPreview?: TikTokPreview;
  /** Fiche créateur issue du dernier bilan : envoyée à l'IA pour personnaliser ses conseils */
  creatorCard?: Record<string, any>;
}

export interface TikTokPreview {
  handle: string;
  nickname: string;
  avatar: string | null;
  verified?: boolean;
  followers: number;
  likes: number;
  videoCount: number;
}

/** « @Nom.Compte » ou un lien tiktok.com/@nom → « nom.compte » (null si invalide). */
export const normalizeTikTok = (raw?: string | null): string | null => {
  if (!raw) return null;
  let h = raw.trim();
  const m = h.match(/tiktok\.com\/@([^/?#\s]+)/i);
  if (m) h = m[1];
  h = h.replace(/^@+/, '').toLowerCase();
  return /^[a-z0-9._]{2,24}$/.test(h) ? h : null;
};

// ---------- Libellés (mêmes clés que le questionnaire) ----------

export const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant·e', intermediate: 'Intermédiaire', advanced: 'Avancé·e', pro: 'Pro',
};
export const NICHE_LABELS: Record<string, string> = {
  comedy: 'Comédie', music: 'Musique', beauty: 'Beauté', education: 'Éducation', gaming: 'Gaming',
  fitness: 'Fitness', tech: 'Tech', food: 'Cuisine', travel: 'Voyages', lifestyle: 'Lifestyle',
};
export const GOAL_LABELS: Record<string, string> = {
  views: 'Plus de vues', engagement: "Plus d'engagement", fanbase: 'Une vraie communauté', monetization: 'Monétiser mon contenu',
};
export const BLOCKER_LABELS: Record<string, string> = {
  ideas: 'Trouver des idées', hook: 'Accrocher dès le début', consistency: 'Être régulier', editing: 'Le montage', algorithm: "Comprendre l'algorithme",
};
export const FREQUENCY_LABELS: Record<string, string> = {
  '1week': '1 fois par semaine', '2week': '2 à 3 fois par semaine', daily: 'Tous les jours', irregular: 'Quand j’ai le temps',
};
/** Nombre de posts conseillés par semaine selon la fréquence choisie. */
export const POSTS_PER_WEEK: Record<string, number> = { '1week': 1, '2week': 3, daily: 5, irregular: 2 };

export const label = (map: Record<string, string>, key?: string | null, fallback = '') => (key ? map[key] ?? fallback : fallback);
export const nichesLabel = (niches?: string[]) => (niches ?? []).map((n) => NICHE_LABELS[n] ?? n).join(' · ');

/** Réponses brutes du questionnaire → profil. */
export const answersToProfile = (answers: Record<string, string[] | undefined>): CreatorProfile => ({
  name: answers.name?.[0]?.trim() || undefined,
  level: answers.level?.[0],
  niches: answers.niches ?? [],
  goal: answers.goal?.[0],
  blocker: answers.blocker?.[0],
  frequency: answers.frequency?.[0],
  tiktok: normalizeTikTok(answers.tiktok?.[0]) ?? undefined,
});

/** Profil → format des réponses du questionnaire (pour réafficher le plan). */
export const profileToAnswers = (p: CreatorProfile): Record<string, string[]> => {
  const a: Record<string, string[]> = {};
  if (p.name) a.name = [p.name];
  if (p.level) a.level = [p.level];
  if (p.niches?.length) a.niches = p.niches;
  if (p.goal) a.goal = [p.goal];
  if (p.blocker) a.blocker = [p.blocker];
  if (p.frequency) a.frequency = [p.frequency];
  if (p.tiktok) a.tiktok = [p.tiktok];
  return a;
};

/** Prénom affichable (« Ilyas »), ou chaîne vide. */
export const firstName = (p?: CreatorProfile | null) => (p?.name ?? '').trim().split(/\s+/)[0] ?? '';

// ---------- Stockage ----------

const KEY = '@viraly_creator_profile';
let cache: CreatorProfile | null = null;
let loaded = false;
const listeners = new Set<(p: CreatorProfile | null) => void>();

const clean = (p: CreatorProfile) => {
  const out: any = {};
  Object.entries(p).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') out[k] = v; });
  return out as CreatorProfile;
};

const emit = (p: CreatorProfile | null) => {
  cache = p;
  listeners.forEach((l) => l(p));
};

export const loadLocalProfile = async (): Promise<CreatorProfile | null> => {
  if (loaded) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : null;
  } catch {
    cache = null;
  }
  loaded = true;
  return cache;
};

/** Met à jour le profil sur le téléphone (et dans le compte si connecté). */
export const saveCreatorProfile = async (patch: CreatorProfile, uid?: string | null) => {
  const current = (await loadLocalProfile()) ?? {};
  // Une valeur absente ne remplace rien ; '' efface le champ
  const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as CreatorProfile;
  const next = clean({ ...current, ...defined });
  // Nouveau compte TikTok : l'ancienne fiche et l'ancien aperçu ne le concernent plus
  if (patch.tiktok !== undefined && patch.tiktok !== current.tiktok) {
    if (!patch.creatorCard) delete next.creatorCard;
    if (!patch.tiktokPreview || patch.tiktokPreview.handle !== patch.tiktok) delete next.tiktokPreview;
    if (!patch.tiktok) delete next.tiktok;
  }
  // Niche principale changée : les publications prévues par l'IA suivent
  if (patch.niches?.[0] && patch.niches[0] !== current.niches?.[0]) {
    renameAiPublishTasks(patch.niches[0], uid && uid !== 'guest' ? uid : null).catch(() => {});
  }
  emit(next);
  await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  if (uid && uid !== 'guest') {
    const { calendarSeeded, ...rest } = next;
    const remote: any = { ...rest };
    // Compte TikTok retiré : on l'efface aussi du compte (null = supprimé à la relecture)
    if (patch.tiktok === '') Object.assign(remote, { tiktok: null, tiktokPreview: null, creatorCard: null });
    await setDoc(doc(db, 'users', uid), remote, { merge: true }).catch((e: any) => {
      console.warn('⚠️ Profil non synchronisé :', e?.code || e?.message);
    });
  }
  return next;
};

/** Remplace le profil du téléphone (sans écrire dans le compte) : profil relu depuis Firestore. */
export const setLocalProfile = async (p: CreatorProfile) => {
  const next = clean(p);
  loaded = true;
  emit(next);
  await AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  return next;
};

/** Profil enregistré dans le compte (Firestore). Lève une erreur si Firestore ne répond pas. */
export const fetchRemoteProfile = async (uid: string, timeoutMs = 10000): Promise<CreatorProfile | null> => {
  const snap: any = await Promise.race([
    getDoc(doc(db, 'users', uid)),
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)),
  ]);
  return snap?.exists?.() ? fromRemote(snap.data()) : null;
};

export const clearLocalProfile = async () => {
  loaded = true;
  emit(null);
  await AsyncStorage.removeItem(KEY).catch(() => {});
};

const fromRemote = (data: any): CreatorProfile => clean({
  name: data?.name,
  level: data?.level ?? data?.questionnaireAnswers?.level?.[0],
  niches: Array.isArray(data?.niches) ? data.niches : data?.questionnaireAnswers?.niches,
  goal: data?.goal ?? data?.questionnaireAnswers?.goal?.[0],
  blocker: data?.blocker ?? data?.questionnaireAnswers?.blocker?.[0],
  frequency: data?.frequency ?? data?.questionnaireAnswers?.frequency?.[0],
  tiktok: data?.tiktok,
  tiktokPreview: data?.tiktokPreview,
  creatorCard: data?.creatorCard,
});

/**
 * Profil courant. Lit d'abord le téléphone (instantané), puis le compte Firestore.
 */
export const useCreatorProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(cache);
  const [loading, setLoading] = useState(!loaded);
  const uid = user?.uid ?? null;

  useEffect(() => {
    listeners.add(setProfile);
    return () => { listeners.delete(setProfile); };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    (async () => {
      const local = await loadLocalProfile();
      if (alive) setProfile(local);
      if (uid) {
        try {
          const snap: any = await getDoc(doc(db, 'users', uid));
          if (snap?.exists?.()) {
            const remote = fromRemote(snap.data());
            // Le compte fait foi ; le téléphone complète ce qui manque (ex. prénom saisi hors ligne)
            const merged = clean({ ...(local ?? {}), ...remote });
            emit(merged);
            AsyncStorage.setItem(KEY, JSON.stringify(merged)).catch(() => {});
            // Réponses données avant la création du compte : on les envoie
            const missing = Object.keys(local ?? {}).some((k) => k !== 'calendarSeeded' && (remote as any)[k] === undefined);
            if (missing) saveCreatorProfile({}, uid);
          } else if (local) {
            saveCreatorProfile({}, uid);
          }
        } catch (e: any) {
          console.warn('⚠️ Profil Firestore indisponible :', e?.code || e?.message);
        }
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [uid, authLoading]);

  const update = useCallback((patch: CreatorProfile) => saveCreatorProfile(patch, uid), [uid]);

  return { profile, loading: loading || authLoading, update };
};

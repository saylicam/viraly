import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Historique des analyses, gardé sur le téléphone.
 * Sert aux vrais chiffres de l'accueil et du profil (nombre d'analyses, note moyenne…).
 */

export interface AnalysisEntry {
  id: string;
  date: string;        // ISO
  score: number;       // sur 100
  title: string;       // résumé court
  videoUri: string;
  result?: any;        // résultat complet (gardé pour les plus récentes seulement)
}

const KEY = '@viraly_analysis_history';
const MAX = 50;
const MAX_FULL = 10;

let cache: AnalysisEntry[] | null = null;
const listeners = new Set<(h: AnalysisEntry[]) => void>();

const load = async (): Promise<AnalysisEntry[]> => {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : [];
  } catch {
    cache = [];
  }
  return cache as AnalysisEntry[];
};

const persist = (list: AnalysisEntry[]) => {
  cache = list;
  listeners.forEach((l) => l(list));
  AsyncStorage.setItem(KEY, JSON.stringify(list)).catch(() => {});
};

export const recordAnalysis = async (videoUri: string, result: any) => {
  const analysis = result?.premium || result || {};
  const score = Math.round(Number(analysis.score_sur_100));
  if (!Number.isFinite(score)) return;
  const title = String(analysis.score_titre || analysis.resume_video?.court || 'Vidéo analysée').slice(0, 120);
  const list = await load();
  const entry: AnalysisEntry = { id: `${Date.now()}`, date: new Date().toISOString(), score, title, videoUri, result };
  const next = [entry, ...list].slice(0, MAX).map((e, i) => (i < MAX_FULL ? e : { ...e, result: undefined }));
  persist(next);
};

export const clearAnalysisHistory = () => persist([]);

/** Début de la semaine en cours (lundi 00:00). */
const startOfWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

export const historyStats = (list: AnalysisEntry[]) => {
  const count = list.length;
  const average = count ? Math.round(list.reduce((s, e) => s + e.score, 0) / count) : null;
  const best = count ? Math.max(...list.map((e) => e.score)) : null;
  const last = list[0] ?? null;
  const daysSinceLast = last ? Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000) : null;
  const week = startOfWeek().getTime();
  const thisWeek = list.filter((e) => new Date(e.date).getTime() >= week).length;
  return { count, average, best, last, daysSinceLast, thisWeek };
};

export const useAnalysisHistory = () => {
  const [history, setHistory] = useState<AnalysisEntry[]>(cache ?? []);
  useEffect(() => {
    listeners.add(setHistory);
    load().then(setHistory);
    return () => { listeners.delete(setHistory); };
  }, []);
  return history;
};

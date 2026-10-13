import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Tendance mise de côté par le créateur (stockée sur le téléphone). */
export interface FavoriteItem {
  kind: 'sound' | 'video';
  id: string;
  title: string;
  subtitle: string;
  cover: string | null;
  url: string;
  views?: number | null;
  savedAt: number;
}

const KEY = '@viraly_trend_favorites';
const MAX = 60;

// Partagé entre tous les écrans qui utilisent le hook
let cache: FavoriteItem[] | null = null;
const listeners = new Set<(items: FavoriteItem[]) => void>();

const emit = (items: FavoriteItem[]) => {
  cache = items;
  listeners.forEach((l) => l(items));
  AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
};

/** Efface les favoris du téléphone (déconnexion). */
export const clearTrendFavorites = () => emit([]);

export const useTrendFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(cache ?? []);

  useEffect(() => {
    listeners.add(setFavorites);
    if (cache == null) {
      AsyncStorage.getItem(KEY)
        .then((raw) => {
          const items = raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
          cache = Array.isArray(items) ? items : [];
          listeners.forEach((l) => l(cache as FavoriteItem[]));
        })
        .catch(() => { cache = []; });
    }
    return () => { listeners.delete(setFavorites); };
  }, []);

  const isFavorite = useCallback(
    (kind: FavoriteItem['kind'], id: string) => favorites.some((f) => f.kind === kind && f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    const current = cache ?? [];
    const exists = current.some((f) => f.kind === item.kind && f.id === item.id);
    emit(exists
      ? current.filter((f) => !(f.kind === item.kind && f.id === item.id))
      : [{ ...item, savedAt: Date.now() }, ...current].slice(0, MAX));
  }, []);

  return { favorites, isFavorite, toggleFavorite };
};

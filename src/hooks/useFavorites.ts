import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { FavoriteItem } from '../types/favorite';

const getUserId = (): string | null => {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Login response is { accessToken, user: { id, ... } }
    // but older code may have stored user object directly
    return (
      parsed?.user?.id ||   // { accessToken, user: { id } }  ← login shape
      parsed?.id ||         // { id, ... }                     ← direct user shape
      parsed?.userId ||
      parsed?.sub ||
      null
    );
  } catch {
    return null;
  }
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // tracks which placeIds are currently being toggled (prevents double clicks)
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<FavoriteItem[]>(`/favorites/user/${userId}`);
      setFavorites(response.data);
      setFavoritedIds(new Set(response.data.map((f) => f.place.id)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao buscar favoritos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (placeId: string) => {
    const userId = getUserId();
    if (!userId) return;

    // Prevent concurrent toggles for the same place
    if (toggling.has(placeId)) return;

    // Optimistic update
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
    setToggling((prev) => new Set(prev).add(placeId));

    try {
      const res = await api.post<{ favorited: boolean }>('/favorites', { placeId, userId });
      // Reconcile with confirmed backend state
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (res.data.favorited) next.add(placeId);
        else next.delete(placeId);
        return next;
      });
      // Sync full list in background (don't await – avoids UI stall)
      fetchFavorites();
    } catch (err: any) {
      // Rollback optimistic update on error
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (next.has(placeId)) next.delete(placeId);
        else next.add(placeId);
        return next;
      });
      console.error('Erro ao alternar favorito:', err);
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(placeId);
        return next;
      });
    }
  }, [fetchFavorites, toggling]);

  const isFavorite = useCallback(
    (placeId: string) => favoritedIds.has(placeId),
    [favoritedIds]
  );

  const isToggling = useCallback(
    (placeId: string) => toggling.has(placeId),
    [toggling]
  );

  return { favorites, loading, error, isFavorite, isToggling, toggleFavorite, refetch: fetchFavorites };
};

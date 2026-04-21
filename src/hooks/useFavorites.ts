import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { FavoriteItem } from '../types/favorite';

const getUserId = (): string | null => {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user.id || user.userId || user.sub || null;
  } catch {
    return null;
  }
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      await api.post('/favorites', { placeId, userId });
      // Optimistic update: flip the state locally then refetch to sync
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (next.has(placeId)) {
          next.delete(placeId);
        } else {
          next.add(placeId);
        }
        return next;
      });
      // Refetch to keep list in sync
      fetchFavorites();
    } catch (err: any) {
      console.error('Erro ao alternar favorito:', err);
    }
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (placeId: string) => favoritedIds.has(placeId),
    [favoritedIds]
  );

  return { favorites, loading, error, isFavorite, toggleFavorite, refetch: fetchFavorites };
};

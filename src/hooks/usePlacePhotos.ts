import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { PlacePhoto } from '../types/placePhoto';

export const usePlacePhotos = (placeId: string | undefined) => {
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<PlacePhoto[]>(`/place-photos/place/${placeId}`);
      setPhotos(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao buscar fotos');
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, loading, error, refetch: fetchPhotos };
};

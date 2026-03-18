import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Place } from '../types/place';

export const usePlaceDetails = (id: string | undefined) => {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaceDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Place>(`/places/${id}`);
      setPlace(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch place details');
      console.error('Error fetching place details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaceDetails();
  }, [fetchPlaceDetails]);

  return { place, loading, error, refetch: fetchPlaceDetails };
};

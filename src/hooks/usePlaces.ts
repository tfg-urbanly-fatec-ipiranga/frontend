import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Place } from '../types/place';

export const usePlaces = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Place[]>('/places');
      setPlaces(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch places');
      console.error('Error fetching places:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  return { places, loading, error, refetch: fetchPlaces };
};

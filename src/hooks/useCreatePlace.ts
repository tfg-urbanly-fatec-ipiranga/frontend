import { useState } from 'react';
import api from '../services/api';
import type { Place } from '../types/place';

export const useCreatePlace = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlace = async (placeData: any): Promise<Place | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<Place>('/places', placeData);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create place';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      console.error('Error creating place:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createPlace, loading, error };
};

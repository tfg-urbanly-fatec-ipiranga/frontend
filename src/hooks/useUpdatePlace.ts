import { useState } from 'react';
import api from '../services/api';
import type { Place } from '../types/place';

export const useUpdatePlace = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePlace = async (id: string, data: Partial<Place>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put(`/places/${id}`, data);
      return response.data;

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updatePlace, loading, error };
};
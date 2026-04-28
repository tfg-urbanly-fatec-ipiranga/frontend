import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Review } from '../types/review';

export const usePlaceReviews = (placeId: string | undefined) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Review[]>(`/reviews/place/${placeId}`);
      setReviews(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao buscar avaliações');
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  return { reviews, averageRating, loading, error, refetch: fetchReviews };
};

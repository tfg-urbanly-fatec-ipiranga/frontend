import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Review } from '../types/review';

export const usePlaceReviews = (placeId: string | undefined) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    if (!placeId) return;

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<Review[]>(`/reviews/place/${placeId}`);
        setReviews(response.data);

        if (response.data.length > 0) {
          const sum = response.data.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating(sum / response.data.length);
        } else {
          setAverageRating(null);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar avaliações.');
        console.error('Error fetching place reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [placeId]);

  return { reviews, averageRating, loading, error };
};

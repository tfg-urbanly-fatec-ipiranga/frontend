import { useEffect, useState } from 'react';
import api from '../services/api';

export interface PendingReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;

  user: {
    firstName: string;
    lastName: string;
  };

  place: {
    id: string;
    name: string;
  };
}

export function usePendingReviews() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {

    async function fetchReviews() {
      try {

        const response = await api.get('/reviews/pending');

        setReviews(response.data);

      } catch (err) {
        setError('Erro ao carregar avaliações');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();

  }, []);

  return {
    reviews,
    loading,
    error,
  };
}
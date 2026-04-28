import { useState, useEffect } from 'react';
import api from '../services/api';

export interface Tag {
  id: string;
  name: string;
}

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const response = await api.get<Tag[]>('/tags');
        setTags(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch tags');
        console.error('Error fetching tags:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading, error };
};

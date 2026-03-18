import { useState } from 'react';
import api from '../services/api';

export const useUploadAvatar = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (file: File, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/users/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data; // The backend returns the updated user
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao enviar avatar';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      console.error('Error uploading avatar:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadAvatar, loading, error };
};

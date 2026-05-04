import { useState } from 'react';
import api from '../services/api';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao registrar usuário';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      console.error('Error registering user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (credentials: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro no login';
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
      console.error('Error logging in:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, userData: any) => {
  setLoading(true);
  setError(null);
  try {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || 'Erro ao atualizar usuário';
    setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    console.error('Error updating user:', err);
    return null;
  } finally {
    setLoading(false);
  }
};

  return { registerUser, loginUser, updateUser, loading, error };
};

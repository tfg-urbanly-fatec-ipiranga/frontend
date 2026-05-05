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

  const changePassword = async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error('Usuário não autenticado');

      const parsed = JSON.parse(storedUser);
      const user = parsed.user || parsed;

      const response = await api.patch('/auth/change-password', {
        userId: user.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      return response.data;

    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Erro ao alterar senha';
      setError(message);
      console.error('Error changing password:', err);
      throw err; 
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
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { registerUser, loginUser, updateUser, changePassword, loading, error };
};

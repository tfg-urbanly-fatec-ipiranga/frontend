import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      const token = user.access_token || user.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Falha ao ler dados do usuário no localStorage:', e);
    }
  }
  return config;
});

export default api;

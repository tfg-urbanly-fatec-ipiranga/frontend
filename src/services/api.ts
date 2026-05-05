import axios from 'axios';
//import { useAuthContext } from "../context/AuthContext";

//const { logout } = useAuthContext();


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
      const token = user.accessToken || user.access_token || user.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Falha ao ler dados do usuário no localStorage:', e);
    }
  }
  return config;
});

/*
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const stored = localStorage.getItem('user');
      if (stored) {
        localStorage.removeItem('user');
        window.location.href = '/login';
        logout();
      }
    }
    return Promise.reject(error);
  }
);
*/

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    const isAuthEndpoint = url?.includes('/auth/change-password');

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('user');
      window.location.href = '/login';
      //logout();
    }

    return Promise.reject(error);
  }
);


export default api;

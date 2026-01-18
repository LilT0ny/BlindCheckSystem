import axios from 'axios';

// Variable en memoria por pestaña (cada pestaña tiene su propia instancia de JavaScript)
let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  console.log(`[api.js] Token actualizado:`, token ? '✅ SET' : '❌ CLEARED');
};

export const getAuthToken = () => {
  return authToken;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Interceptor para agregar token al header
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('❌ [api.js] 401 - Token inválido o expirado');
      setAuthToken(null);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

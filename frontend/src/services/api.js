import axios from 'axios';

// SessionStorage es verdaderamente por pestaña
export const setAuthToken = (token) => {
  if (token) {
    sessionStorage.setItem('auth_token_tab', token);
  } else {
    sessionStorage.removeItem('auth_token_tab');
  }
};

export const getAuthToken = () => {
  return sessionStorage.getItem('auth_token_tab');
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
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Redirigir SOLO si estamos en una ruta protegida
      if (!window.location.pathname.includes('/login') && !window.location.pathname === '/') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

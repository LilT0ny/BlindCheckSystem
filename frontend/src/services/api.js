import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '/api',
  headers: {
    // No establecer Content-Type por defecto, dejar que axios lo maneje
  }
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    // Primero intentar desde sessionStorage (compatibilidad con código anterior)
    let token = sessionStorage.getItem('token');

    // Si no hay en sessionStorage, intentar desde Zustand
    if (!token) {
      try {
        const authStoreModule = require('../store/authStore');
        token = authStoreModule.useAuthStore.getState().token;
      } catch (e) {
        // Si falla, continuar sin token
      }
    }

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
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // También limpiar Zustand si está disponible
      try {
        const authStoreModule = require('../store/authStore');
        authStoreModule.useAuthStore.getState().logout();
      } catch (e) {
        // Continuar si falla
      }

      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;


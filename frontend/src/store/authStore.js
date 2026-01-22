import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  login: (userData) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    set({
      user: userData,
      isAuthenticated: true
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error("Logout failed", e);
    }
    sessionStorage.removeItem('user');
    set({
      user: null,
      isAuthenticated: false
    });
  },

  updateUser: (userData) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },

  // Restaurar sesión verificando cookie con el backend
  restoreSession: async () => {
    try {
      const response = await api.get('/auth/me');
      // response.data es el usuario directmente según backend logic
      const user = response.data;
      sessionStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (error) {
      sessionStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  }
}));

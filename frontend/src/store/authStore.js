import { create } from 'zustand';
import api, { setAuthToken } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,  // Token en memoria para desarrollo
  
  login: (userData, token) => {
    // Guardar token en memoria (NO en storage)
    setAuthToken(token);  // Actualizar token en api.js
    set({ 
      user: userData, 
      isAuthenticated: true,
      token: token  // Guardar token para enviarlo en headers
    });
  },
  
  logout: async () => {
    // Limpiar todo
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    }
    
    setAuthToken(null);  // Limpiar token en api.js
    set({ 
      user: null, 
      isAuthenticated: false,
      token: null  // Limpiar token
    });
  },
  
  updateUser: (userData) => {
    set({ user: userData });
  },

  // Restaurar sesión desde el servidor (usando token en memory)
  restoreSession: async () => {
    try {
      // restoreSession NO intenta restaurar porque el token está en memoria
      // Solo se establece cuando hay una sesión activa en memoria
      set({ 
        isLoading: false
      });
    } catch (error) {
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false
      });
    }
  }
}));

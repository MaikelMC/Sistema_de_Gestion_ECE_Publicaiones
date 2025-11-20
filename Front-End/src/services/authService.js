import api from './api';
import { config } from '../config/config';

export const authService = {
  /**
   * Login de usuario
   */
  login: async (username, password) => {
    const response = await api.post(config.endpoints.LOGIN, {
      username,
      password
    });
    
    if (response.data.tokens) {
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Registro de nuevo usuario
   */
  register: async (userData) => {
    const response = await api.post(config.endpoints.REGISTER, userData);
    
    if (response.data.tokens) {
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Logout
   */
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post(config.endpoints.LOGOUT, {
          refresh_token: refreshToken
        });
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar COMPLETAMENTE el localStorage
      localStorage.clear();
      // Alternativamente, remover items específicos:
      // localStorage.removeItem('access_token');
      // localStorage.removeItem('refresh_token');
      // localStorage.removeItem('user');
      console.log('✅ Sesión cerrada, localStorage limpiado');
    }
  },

  /**
   * Obtener perfil del usuario actual
   */
  getProfile: async () => {
    const response = await api.get(config.endpoints.PROFILE);
    return response.data;
  },

  /**
   * Actualizar perfil
   */
  updateProfile: async (data) => {
    const response = await api.patch(config.endpoints.PROFILE, data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  /**
   * Cambiar contraseña
   */
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post(config.endpoints.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword
    });
    return response.data;
  },

  /**
   * Obtener usuario actual desde localStorage
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verificar si está autenticado
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Obtener token de acceso
   */
  getAccessToken: () => {
    return localStorage.getItem('access_token');
  }
};

export default authService;

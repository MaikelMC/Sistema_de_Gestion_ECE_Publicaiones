import { useState, useEffect } from 'react';
import authService from '../services/authService';
import api from '../services/api';

/**
 * Hook personalizado para manejar autenticación y verificación de sesión
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Verificar autenticación y actualizar datos del usuario cada 2 minutos
    const interval = setInterval(() => {
      refreshUserData();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const refreshUserData = async () => {
    try {
      if (authService.isAuthenticated()) {
        const response = await api.get('/auth/users/me/');
        const updatedUser = response.data;
        
        // Actualizar localStorage con los datos más recientes
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Si el rol cambió, forzar recarga
        const currentUser = authService.getCurrentUser();
        if (currentUser && currentUser.role !== updatedUser.role) {
          console.log('Rol del usuario cambió, recargando página...');
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
      // Si falla la autenticación, cerrar sesión
      if (error.response?.status === 401) {
        await logout();
      }
    }
  };

  const checkAuth = () => {
    try {
      const authenticated = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();
      
      setIsAuthenticated(authenticated);
      setUser(currentUser);
      
      // Verificar si el token está por expirar (opcional)
      if (authenticated) {
        const token = localStorage.getItem('access_token');
        if (token) {
          // Decodificar token JWT para verificar expiración
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp * 1000; // Convertir a milisegundos
          const now = Date.now();
          
          // Si el token expira en menos de 5 minutos, intentar renovarlo
          if (exp - now < 5 * 60 * 1000) {
            console.log('Token próximo a expirar, renovando...');
            // El interceptor de axios se encargará de renovarlo
          }
        }
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'Usuario';
    
    if (user.first_name) {
      return user.first_name;
    } else {
      return user.username || 'Usuario';
    }
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    user,
    isAuthenticated,
    loading,
    getUserDisplayName,
    logout,
    checkAuth
  };
};

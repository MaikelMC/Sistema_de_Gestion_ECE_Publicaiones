import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook personalizado para gestionar notificaciones
 * Obtiene el contador de notificaciones no leídas y actualiza automáticamente
 */
export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/requests/notifications/stats/');
      setUnreadCount(response.data.unread || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar contador de notificaciones:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar inicial
    fetchUnreadCount();

    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { unreadCount, loading, refresh: fetchUnreadCount };
};

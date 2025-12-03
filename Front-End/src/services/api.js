import axios from 'axios';
import { config } from '../config/config';
import { toast } from 'react-toastify';

// Crear instancia de axios
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No access token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const data = error.response?.data;

    // Manejo centralizado de errores comunes
    if (status === 400) {
      // Mostrar detalles de validación si están disponibles
      const message = data?.detail || JSON.stringify(data) || 'Bad Request';
      toast.error(message, { autoClose: 4000 });
      return Promise.reject(error);
    }

    if (status === 403) {
      // Navegar a página de acceso denegado
      window.location.href = '/forbidden';
      return Promise.reject(error);
    }

    if (status === 404) {
      // Para peticiones GET a recursos, mostrar NotFound SPA
      if ((originalRequest?.method || '').toLowerCase() === 'get') {
        window.location.href = '/not-found';
        return Promise.reject(error);
      }
      toast.info('Recurso no encontrado (404)', { autoClose: 3000 });
      return Promise.reject(error);
    }

    if (status === 500) {
      // Redirigir a una página de error del servidor
      window.location.href = '/server-error';
      return Promise.reject(error);
    }

    // Si el token expiró, intentar renovarlo
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${config.API_BASE_URL}${config.endpoints.TOKEN_REFRESH}`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Reintentar la petición original
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si falla la renovación, cerrar sesión
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Si no se manejó arriba, mostrar mensaje genérico para el usuario
    const fallback = data?.detail || error.message || 'Error en la petición';
    toast.error(fallback, { autoClose: 4000 });
    return Promise.reject(error);
  }
);

export default api;

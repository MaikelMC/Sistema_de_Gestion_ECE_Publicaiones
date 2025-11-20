import api from './api';
import { config } from '../config/config';

export const requestService = {
  /**
   * Obtener todas las solicitudes ECE
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `${config.endpoints.ECE_REQUESTS}?${params}` : config.endpoints.ECE_REQUESTS;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener solicitudes del usuario actual
   */
  getMyRequests: async () => {
    const response = await api.get(config.endpoints.ECE_REQUESTS_MY);
    return response.data;
  },

  /**
   * Obtener solicitudes pendientes de revisión (para jefe)
   */
  getPendingReview: async () => {
    const response = await api.get(config.endpoints.ECE_REQUESTS_PENDING);
    return response.data;
  },

  /**
   * Obtener una solicitud por ID
   */
  getById: async (id) => {
    const response = await api.get(`${config.endpoints.ECE_REQUESTS}${id}/`);
    return response.data;
  },

  /**
   * Crear nueva solicitud
   */
  create: async (formData) => {
    const response = await api.post(config.endpoints.ECE_REQUESTS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Enviar solicitud para revisión
   */
  submitForReview: async (id) => {
    const response = await api.post(config.endpoints.ECE_REQUEST_SUBMIT(id));
    return response.data;
  },

  /**
   * Revisar solicitud (jefe)
   */
  review: async (id, isApproved, comments = '') => {
    const response = await api.post(config.endpoints.ECE_REQUEST_REVIEW(id), {
      is_approved: isApproved,
      comments: comments
    });
    return response.data;
  },

  /**
   * Eliminar solicitud
   */
  delete: async (id) => {
    const response = await api.delete(`${config.endpoints.ECE_REQUESTS}${id}/`);
    return response.data;
  }
};

export default requestService;

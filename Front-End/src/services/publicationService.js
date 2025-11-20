import api from './api';
import { config } from '../config/config';

export const publicationService = {
  /**
   * Obtener todas las publicaciones (con filtros opcionales)
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `${config.endpoints.PUBLICATIONS}?${params}` : config.endpoints.PUBLICATIONS;
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener publicaciones del usuario actual
   */
  getMyPublications: async () => {
    const response = await api.get(config.endpoints.PUBLICATIONS_MY);
    return response.data;
  },

  /**
   * Obtener publicaciones pendientes de revisión (para jefe)
   */
  getPendingReview: async () => {
    const response = await api.get(config.endpoints.PUBLICATIONS_PENDING);
    return response.data;
  },

  /**
   * Obtener una publicación por ID
   */
  getById: async (id) => {
    const response = await api.get(`${config.endpoints.PUBLICATIONS}${id}/`);
    return response.data;
  },

  /**
   * Crear nueva publicación
   */
  create: async (formData) => {
    const response = await api.post(config.endpoints.PUBLICATIONS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Actualizar publicación
   */
  update: async (id, formData) => {
    const response = await api.patch(`${config.endpoints.PUBLICATIONS}${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Eliminar publicación
   */
  delete: async (id) => {
    const response = await api.delete(`${config.endpoints.PUBLICATIONS}${id}/`);
    return response.data;
  },

  /**
   * Enviar publicación para revisión
   */
  submitForReview: async (id) => {
    const response = await api.post(config.endpoints.PUBLICATION_SUBMIT(id));
    return response.data;
  },

  /**
   * Revisar publicación (jefe)
   */
  review: async (id, isApproved, comments = '') => {
    const response = await api.post(config.endpoints.PUBLICATION_REVIEW(id), {
      is_approved: isApproved,
      comments: comments
    });
    return response.data;
  }
};

export default publicationService;

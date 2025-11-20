import api from './api';
import { config } from '../config/config';

export const tutorService = {
  /**
   * Obtener publicaciones pendientes de opinión del tutor
   */
  getPendingPublications: async () => {
    const response = await api.get('/tutor-opinions/pending_publications/');
    return response.data;
  },

  /**
   * Obtener opiniones emitidas por el tutor
   */
  getMyOpinions: async () => {
    const response = await api.get('/tutor-opinions/my_opinions/');
    return response.data;
  },

  /**
   * Emitir opinión sobre una publicación
   */
  createOpinion: async (publicationId, opinionData) => {
    const response = await api.post('/tutor-opinions/', {
      publication: publicationId,
      ...opinionData
    });
    return response.data;
  },

  /**
   * Obtener estudiantes asignados al tutor
   */
  getMyStudents: async () => {
    const response = await api.get('/tutor-students/my_students/');
    return response.data;
  },

  /**
   * Obtener todas las opiniones (con filtros opcionales)
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const url = params ? `/tutor-opinions/?${params}` : '/tutor-opinions/';
    const response = await api.get(url);
    return response.data;
  }
};

export default tutorService;

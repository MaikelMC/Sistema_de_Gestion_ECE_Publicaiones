import api from './api';
import { config } from '../config/config';

const buildPublicationsUrl = (endpoint) => {
  const pub = config.endpoints.PUBLICATIONS.replace(/\/$/, '');
  const ep = endpoint.replace(/^\//, '');
  return `${pub}/${ep}`;
};

export const tutorService = {
  /**
   * Obtener publicaciones pendientes de opinión del tutor
   */
  getPendingPublications: async () => {
    const url = buildPublicationsUrl(config.endpoints.TUTOR_OPINIONS_PENDING);
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener opiniones emitidas por el tutor
   */
  getMyOpinions: async () => {
    const url = buildPublicationsUrl(config.endpoints.TUTOR_OPINIONS_MY);
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Emitir opinión sobre una publicación
   */
  createOpinion: async (publicationId, opinionData) => {
    const url = buildPublicationsUrl(config.endpoints.TUTOR_OPINIONS);
    const response = await api.post(url, {
      publication: publicationId,
      ...opinionData
    });
    return response.data;
  },

  /**
   * Obtener estudiantes asignados al tutor
   */
  getMyStudents: async () => {
    const url = buildPublicationsUrl(config.endpoints.TUTOR_STUDENTS_MY);
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Obtener todas las opiniones (con filtros opcionales)
   */
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const base = buildPublicationsUrl(config.endpoints.TUTOR_OPINIONS);
    const url = params ? `${base}?${params}` : base;
    const response = await api.get(url);
    return response.data;
  }
};

export default tutorService;

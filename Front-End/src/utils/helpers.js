import { toast } from 'react-toastify';

/**
 * Manejo centralizado de errores de API
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.response) {
    // Error de respuesta del servidor
    const { status, data } = error.response;

    switch (status) {
      case 400:
        toast.error(data.message || 'Datos inválidos');
        break;
      case 401:
        toast.error('No autorizado. Por favor inicia sesión nuevamente');
        break;
      case 403:
        toast.error('No tienes permisos para realizar esta acción');
        break;
      case 404:
        toast.error('Recurso no encontrado');
        break;
      case 500:
        toast.error('Error del servidor. Intenta más tarde');
        break;
      default:
        toast.error(data.message || 'Error al procesar la solicitud');
    }

    return data;
  } else if (error.request) {
    // Error de red
    toast.error('Error de conexión. Verifica tu internet');
  } else {
    // Otro tipo de error
    toast.error('Error inesperado: ' + error.message);
  }

  return null;
};

/**
 * Formatear fecha en español
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Formatear fecha corta
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

/**
 * Obtener color según estado
 */
export const getStatusColor = (status) => {
  const colors = {
    'en_proceso': '#fbbf24',
    'pending': '#60a5fa',
    'pendiente': '#60a5fa',
    'approved': '#34d399',
    'aprobada': '#34d399',
    'rejected': '#f87171',
    'rechazada': '#f87171',
  };
  return colors[status] || '#9ca3af';
};

/**
 * Obtener etiqueta en español según estado
 */
export const getStatusLabel = (status) => {
  const labels = {
    'en_proceso': 'En Proceso',
    'pending': 'Pendiente',
    'pendiente': 'Pendiente',
    'approved': 'Aprobada',
    'aprobada': 'Aprobada',
    'rejected': 'Rechazada',
    'rechazada': 'Rechazada',
  };
  return labels[status] || status;
};

/**
 * Validar archivo
 */
export const validateFile = (file, maxSize = 10, allowedExtensions = ['.pdf']) => {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' };
  }

  // Validar tamaño (en MB)
  const maxSizeBytes = maxSize * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `El archivo no puede superar los ${maxSize}MB` };
  }

  // Validar extensión
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Solo se permiten archivos ${allowedExtensions.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Descargar archivo
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'download';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default {
  handleApiError,
  formatDate,
  formatDateShort,
  getStatusColor,
  getStatusLabel,
  validateFile,
  downloadFile
};

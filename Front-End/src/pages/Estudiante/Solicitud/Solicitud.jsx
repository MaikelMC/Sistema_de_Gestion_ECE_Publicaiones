// Solicitud.jsx - INTEGRADO CON BACKEND
import './Solicitud.css';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { handleApiError } from '../../../utils/helpers';

function Solicitud() {
  const [solicitud, setSolicitud] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar solicitud existente del usuario autenticado
  useEffect(() => {
    cargarSolicitud();
  }, []);

  const cargarSolicitud = async () => {
    try {
      setLoading(true);
      // Obtener solo las solicitudes del usuario autenticado
      const response = await api.get('/requests/my_requests/');
      
      // Si tiene solicitudes, mostrar la más reciente que esté activa
      if (response.data && response.data.length > 0) {
        // Buscar solicitud activa (en_proceso, pendiente o aprobada)
        const solicitudActiva = response.data.find(s => 
          s.status === 'en_proceso' || s.status === 'pendiente' || s.status === 'aprobada'
        );
        
        if (solicitudActiva) {
          setSolicitud(solicitudActiva);
          setDescripcion(solicitudActiva.description || '');
        }
      }
    } catch (error) {
      console.error('Error al cargar solicitud:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const tiposPermitidos = ['.pdf', '.doc', '.docx'];
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!tiposPermitidos.includes(extension)) {
        alert('Solo se permiten archivos PDF, DOC o DOCX');
        e.target.value = '';
        return;
      }

      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no puede ser mayor a 10MB');
        e.target.value = '';
        return;
      }

      setArchivo(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!archivo) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    if (solicitud && (solicitud.status === 'en_proceso' || solicitud.status === 'pendiente')) {
      toast.warning('Ya tienes una solicitud en proceso. Espera a que sea revisada.');
      return;
    }

    if (solicitud && solicitud.status === 'aprobada') {
      toast.info('Ya tienes una solicitud aprobada. No puedes enviar otra.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('file', archivo);
      if (descripcion) {
        formData.append('description', descripcion);
      }

      // Enviar solicitud al backend
      const response = await api.post('/requests/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('✅ Solicitud enviada correctamente');
      
      // Recargar solicitud
      await cargarSolicitud();
      
      // Limpiar formulario
      setArchivo(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelar = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar tu solicitud?')) {
      return;
    }

    try {
      // Eliminar solicitud del backend
      await api.delete(`/requests/${solicitud.id}/`);
      
      toast.success('🗑️ Solicitud cancelada correctamente');
      setSolicitud(null);
      setDescripcion('');
      
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);
      handleApiError(error);
    }
  };

  const getEstadoColor = (status) => {
    switch (status) {
      case 'en_proceso': return '#f59e0b';
      case 'pendiente': return '#3b82f6';
      case 'aprobada': return '#10b981';
      case 'rechazada': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEstadoTexto = (status) => {
    switch (status) {
      case 'en_proceso': return '🔄 En Proceso';
      case 'pendiente': return '⏳ Pendiente de Revisión';
      case 'aprobada': return '✅ Aprobada';
      case 'rechazada': return '❌ Rechazada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="solicitud-page">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>⏳ Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="solicitud-page">
      <header className="panel-header">
        <img src="Imagenes/logouci.webp" alt="Logo UCI" className="profile-photo"/>
        <h1>Mi Solicitud ECE</h1>
      </header>

      {/* Estado de la Solicitud */}
      <section className="card estado-card">
        <div className="estado-header">
          <h2>Estado de Solicitud ECE</h2>
          <div 
            className="estado-badge"
            style={{ backgroundColor: getEstadoColor(solicitud?.estado) }}
          >
            {getEstadoTexto(solicitud?.estado)}
          </div>
        </div>

        {solicitud ? (
          <div className="solicitud-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Archivo:</span>
                <span className="info-value">{solicitud.nombreArchivo}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Fecha de envío:</span>
                <span className="info-value">
                  {solicitud.created_at 
                    ? new Date(solicitud.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">ID de solicitud:</span>
                <span className="info-value">#{solicitud.id.toString().padStart(6, '0')}</span>
              </div>
            </div>

            {/* Descripción si existe */}
            {solicitud.description && (
              <div className="solicitud-descripcion">
                <h4>Descripción:</h4>
                <p>{solicitud.description}</p>
              </div>
            )}

            {/* Acciones según el estado */}
            <div className="solicitud-actions">
              {(solicitud.status === 'en_proceso' || solicitud.status === 'pendiente') && (
                <div className="proceso-info">
                  <p>⏳ Tu solicitud está siendo revisada por el comité académico.</p>
                  <p><strong>Tiempo estimado:</strong> 3-5 días hábiles</p>
                  <button 
                    className="btn-cancelar"
                    onClick={handleCancelar}
                  >
                    🗑️ Cancelar Solicitud
                  </button>
                </div>
              )}

              {solicitud.status === 'aprobada' && (
                <div className="aprobada-info">
                  <p>🎉 ¡Felicidades! Tu solicitud ha sido aprobada.</p>
                  <p>Puedes proceder con las siguientes etapas del proceso ECE.</p>
                  {solicitud.review_comment && (
                    <div className="comentario-revision">
                      <strong>Comentario:</strong>
                      <p>{solicitud.review_comment}</p>
                    </div>
                  )}
                </div>
              )}

              {solicitud.status === 'rechazada' && (
                <div className="rechazada-info">
                  {solicitud.review_comment && (
                    <div className="comentario-revision">
                      <strong>Motivo del rechazo:</strong>
                      <p>{solicitud.review_comment}</p>
                    </div>
                  )}
                  <p>📋 <strong>Motivos comunes de rechazo:</strong></p>
                  <ul>
                    <li>Documentación incompleta</li>
                    <li>No cumple con los requisitos académicos</li>
                    <li>Formato de archivo incorrecto</li>
                    <li>Información inconsistente</li>
                  </ul>
                  <button 
                    className="btn-eliminar"
                    onClick={handleCancelar}
                  >
                    🗑️ Eliminar Solicitud y Enviar Nueva
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="no-solicitud">Aún no has enviado ninguna solicitud.</p>
        )}
      </section>

      {/* Formulario de Subida */}
      <div className={`submission-list card ${solicitud ? 'disabled' : ''}`}>
        <h2>📤 Enviar Nueva Solicitud</h2>
        
        {solicitud && (solicitud.status === 'en_proceso' || solicitud.status === 'pendiente') ? (
          <div className="mensaje-bloqueo">
            <p>⏳ Ya tienes una solicitud en proceso de revisión.</p>
            <p>No puedes enviar otra solicitud hasta que esta sea revisada.</p>
          </div>
        ) : solicitud && solicitud.status === 'aprobada' ? (
          <div className="mensaje-bloqueo">
            <p>✅ Ya tienes una solicitud aprobada.</p>
            <p>No es necesario enviar otra solicitud.</p>
          </div>
        ) : (
          <form className="upload-form" encType="multipart/form-data" onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="descripcion" className="file-label">
                📝 Descripción de la solicitud (opcional)
              </label>
              <textarea
                id="descripcion"
                className="inputr"
                rows="4"
                placeholder="Describe brevemente tu solicitud ECE..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="file-upload" className="file-label">
                📄 Documento de Solicitud ECE
              </label>
              <input 
                className="inputr" 
                type="file" 
                id="file-upload" 
                name="file-upload" 
                accept=".pdf,.doc,.docx" 
                onChange={handleFileChange}
                required
                disabled={isSubmitting}
              />
              <small className="file-hint">
                Formatos aceptados: PDF, DOC, DOCX (Máx. 10MB)
              </small>
            </div>

            {archivo && (
              <div className="file-preview">
                <span>📎 {archivo.name}</span>
                <span>{(archivo.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}

            <button 
              type="submit" 
              className={`btn-upload ${isSubmitting ? 'submitting' : ''}`}
              disabled={!archivo || isSubmitting}
            >
              {isSubmitting ? '⏳ Enviando...' : '🚀 Enviar Solicitud'}
            </button>

            <div className="requisitos-rapidos">
              <h4>📋 Requisitos de la solicitud:</h4>
              <ul>
                <li>Formulario de solicitud completo</li>
                <li>Certificado de notas actualizado</li>
                <li>Carta de motivación</li>
                <li>Aprobación del tutor académico</li>
              </ul>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Solicitud;
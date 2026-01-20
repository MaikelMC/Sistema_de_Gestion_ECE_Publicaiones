// Solicitud.jsx - INTEGRADO CON BACKEND
import './Solicitud.css';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { handleApiError } from '../../../utils/helpers';
import showConfirm from '../../../utils/showConfirm';

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

  // Monitorear cambios en el estado de solicitud
  useEffect(() => {
    if (solicitud) {
      console.log('✅ Estado solicitud actualizado:', {
        id: solicitud.id,
        status: solicitud.status,
        file_url: solicitud.file_url?.split('/').pop()
      });
    } else {
      console.log('✅ No hay solicitud activa');
    }
  }, [solicitud]);

  const cargarSolicitud = async () => {
    try {
      setLoading(true);
      
      // Obtener solo las solicitudes del usuario autenticado
      const response = await api.get('/requests/my_requests/', {
        params: { t: Date.now() }
      });
      console.log(`📋 Solicitudes obtenidas: ${response.data?.length} total`);
      
      // Si tiene solicitudes, mostrar la más reciente que esté activa
      if (response.data && response.data.length > 0) {
        // Filtrar solicitudes activas (enviada, en_proceso, aprobada o cancelada)
        const solicitudesActivas = response.data.filter(s => {
          return s.status === 'enviada' || s.status === 'en_proceso' || s.status === 'aprobada' || s.status === 'cancelada';
        });
        
        if (solicitudesActivas.length > 0) {
          // Obtener la más reciente
          const solicitudActiva = solicitudesActivas.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0];
          
          console.log(`✅ Solicitud activa encontrada: ID ${solicitudActiva.id}, Status: ${solicitudActiva.status}`);
          setSolicitud(solicitudActiva);
          setDescripcion(solicitudActiva.description || '');
        } else {
          console.log('⚠️ No hay solicitudes activas');
          setSolicitud(null);
        }
      } else {
        console.log('⚠️ Usuario sin solicitudes');
        setSolicitud(null);
      }
    } catch (error) {
      console.error('❌ Error al cargar solicitud:', error.message);
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
        toast.warning('Solo se permiten archivos PDF, DOC o DOCX');
        e.target.value = '';
        return;
      }

      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.warning('El archivo no puede ser mayor a 10MB');
        e.target.value = '';
        return;
      }

      setArchivo(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    console.log('🚀 Enviando solicitud...');
    
    if (!archivo) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    if (solicitud && (solicitud.status === 'enviada' || solicitud.status === 'en_proceso')) {
      toast.warning('Ya tienes una solicitud enviada. Espera a que sea revisada.');
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

      console.log('✅ POST completado, recargando datos...');
      
      toast.success('✅ Solicitud enviada correctamente');
      
      // Pequeño delay para asegurar que el backend procese
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recargar solicitud para obtener los datos completos
      await cargarSolicitud();
      
      // Notificar a otros componentes que la solicitud ha sido actualizada
      localStorage.setItem('solicitud_updated', Date.now().toString());
      window.dispatchEvent(new Event('solicitud_updated'));
      console.log('✅ Evento de sincronización disparado');
      
      // Limpiar formulario
      setArchivo(null);
      setDescripcion('');
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelar = async () => {
    const confirmado = await showConfirm({ message: '¿Estás seguro de que quieres cancelar tu solicitud?' });
    if (!confirmado) return;

    try {
      // Eliminar solicitud del backend
      await api.delete(`/requests/${solicitud.id}/`);
      
      toast.success('🗑️ Solicitud cancelada correctamente');
      setSolicitud(null);
      setDescripcion('');
      
      // Notificar a otros componentes que la solicitud ha sido actualizada
      localStorage.setItem('solicitud_updated', Date.now().toString());
      window.dispatchEvent(new Event('solicitud_updated'));
      
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);
      handleApiError(error);
    }
  };

  const getEstadoColor = (status) => {
    switch (status) {
      case 'enviada': return '#3b82f6';     // Azul cuando está enviada
      case 'en_proceso': return '#3b82f6';  // Azul cuando está en proceso
      case 'aprobada': return '#10b981';    // Verde cuando está aprobada
      case 'cancelada': return '#ef4444';   // Rojo cuando está cancelada
      default: return '#6b7280';
    }
  };

  const getEstadoTexto = (status) => {
    switch (status) {
      case 'enviada': return '📤 Enviada';
      case 'en_proceso': return '🔄 En Proceso';
      case 'aprobada': return '✅ Aprobada';
      case 'cancelada': return '❌ Cancelada';
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
      <section className="card estado-card" key={solicitud?.id}>
        <div className="estado-header">
          <h2>Estado de Solicitud ECE</h2>
          <div 
            className="estado-badge"
            style={{ 
              backgroundColor: getEstadoColor(solicitud?.status),
              transition: 'background-color 0.3s ease'
            }}
          >
            {getEstadoTexto(solicitud?.status)}
          </div>
        </div>

        {solicitud ? (
          <div className="solicitud-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Archivo:</span>
                <span className="info-value file-name">
                  {solicitud.file_url ? solicitud.file_url.split('/').pop() : 'No disponible'}
                </span>
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
              {(solicitud.status === 'enviada' || solicitud.status === 'en_proceso') && (
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

              {solicitud.status === 'cancelada' && (
                <div className="cancelada-info">
                  {solicitud.review_comment && (
                    <div className="comentario-revision">
                      <strong>Motivo de cancelación:</strong>
                      <p>{solicitud.review_comment}</p>
                    </div>
                  )}
                  <p>Tu solicitud ha sido cancelada.</p>
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
          <div className="no-solicitud">
            <p>📝 Aún no has enviado ninguna solicitud ECE.</p>
            <small>Completa el formulario abajo y envía tu solicitud para comenzar.</small>
          </div>
        )}
      </section>

      {/* Formulario de Subida */}
      <div className={`submission-list card ${solicitud ? 'disabled' : ''}`}>
        <h2>📤 Enviar Nueva Solicitud</h2>
        
        {solicitud && (solicitud.status === 'enviada' || solicitud.status === 'en_proceso') ? (
          <div className="mensaje-bloqueo">
            <p>⏳ Ya tienes una solicitud enviada en revisión.</p>
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
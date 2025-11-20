// src/pages/JefeDepartamento/GestionSolicitudes/GestionSolicitud.jsx
import './GestionSolicitud.css';
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

function GestionSolicitud() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [comentario, setComentario] = useState('');
  const [modalTipo, setModalTipo] = useState(''); // 'detalles' o 'rechazo'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [jefeNombre, setJefeNombre] = useState('');

  // Cargar datos del jefe actual
  useEffect(() => {
    const cargarJefe = async () => {
      try {
        const response = await api.get('/auth/users/me/');
        const nombreCompleto = response.data.get_full_name || 
                              `${response.data.first_name} ${response.data.last_name}`.trim() || 
                              response.data.username;
        setJefeNombre(nombreCompleto);
      } catch (err) {
        console.error('Error al cargar datos del jefe:', err);
      }
    };
    cargarJefe();
  }, []);

  // Cargar solicitudes desde API
  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Cargando solicitudes...');
      // Cargar TODAS las solicitudes, no solo pendientes
      const response = await api.get('/ece-requests/');
      console.log('Respuesta del servidor:', response);
      console.log('Datos recibidos:', response.data);
      
      // Verificar si la respuesta es un array o tiene paginación
      const solicitudesData = Array.isArray(response.data) 
        ? response.data 
        : response.data.results || [];
      
      console.log('Solicitudes procesadas:', solicitudesData);
      setSolicitudes(solicitudesData);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      console.error('Detalles:', error.response?.data);
      setError('Error al cargar las solicitudes. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const filtrarSolicitudes = () => {
    let filtered = solicitudes;

    // Filtro por estado
    if (filtro !== 'todas') {
      filtered = filtered.filter(sol => sol.status === filtro);
    }

    // Búsqueda por nombre, matrícula o descripción
    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      filtered = filtered.filter(sol => 
        (sol.student_name && sol.student_name.toLowerCase().includes(searchLower)) ||
        (sol.student_matricula && sol.student_matricula.toLowerCase().includes(searchLower)) ||
        (sol.description && sol.description.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  };

  const cambiarEstadoSolicitud = async (id, nuevoEstado, comentarioRechazo = '') => {
    try {
      setProcesando(true);
      const isApproved = nuevoEstado === 'aprobada';
      
      const comentarioFinal = comentarioRechazo || (isApproved ? `Aprobada por ${jefeNombre}` : '');
      
      console.log('Enviando revisión:', {
        id,
        is_approved: isApproved,
        comments: comentarioFinal
      });
      
      const response = await api.post(`/ece-requests/${id}/review/`, {
        is_approved: isApproved,
        comments: comentarioFinal
      });

      console.log('Respuesta del servidor:', response.data);

      // Recargar solicitudes
      await cargarSolicitudes();
      
      // Cerrar modales
      setSolicitudSeleccionada(null);
      setModalTipo('');
      setComentario('');

      // Mostrar mensaje de confirmación
      const mensaje = isApproved
        ? '✅ Solicitud aprobada correctamente'
        : '❌ Solicitud rechazada correctamente';
      
      alert(mensaje);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      console.error('Detalles del error:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      let mensajeError = 'Error al procesar la solicitud. ';
      
      if (error.response?.status === 403) {
        mensajeError += 'No tienes permisos para realizar esta acción.';
      } else if (error.response?.status === 404) {
        mensajeError += 'No se encontró la solicitud.';
      } else if (error.response?.data?.error) {
        mensajeError += error.response.data.error;
      } else if (error.response?.data?.detail) {
        mensajeError += error.response.data.detail;
      } else {
        mensajeError += 'Por favor, intenta nuevamente.';
      }
      
      alert(mensajeError);
    } finally {
      setProcesando(false);
    }
  };

  const abrirModalDetalles = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalTipo('detalles');
  };

  const abrirModalRechazo = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalTipo('rechazo');
    setComentario(solicitud.comentario || '');
  };

  const cerrarModal = () => {
    setSolicitudSeleccionada(null);
    setModalTipo('');
    setComentario('');
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'en_proceso': return '#3b82f6';
      case 'pendiente': return '#f59e0b';
      case 'aprobada': return '#10b981';
      case 'rechazada': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'en_proceso': return '🔄 En Proceso';
      case 'pendiente': return '⏳ Pendiente';
      case 'aprobada': return '✅ Aprobada';
      case 'rechazada': return '❌ Rechazada';
      default: return '📝 Desconocido';
    }
  };

  const descargarArchivo = (nombreArchivo) => {
    alert(`📥 Descargando archivo: ${nombreArchivo}\n\nEn una implementación real, aquí se descargaría el archivo.`);
  };

  const solicitudesFiltradas = filtrarSolicitudes();

  if (loading) {
    return (
      <div className="gestion-solicitudes-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-solicitudes-page">
      <header className="page-header">
        <h1>📄 Gestión de Solicitudes</h1>
        <p>Revisa y gestiona las solicitudes de los estudiantes</p>
      </header>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={cargarSolicitudes} className="btn-reintentar">
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Estadísticas Rápidas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-number">{solicitudes.length}</span>
            <span className="stat-label">Total Solicitudes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <span className="stat-number">
              {solicitudes.filter(s => s.status === 'en_proceso').length}
            </span>
            <span className="stat-label">En Proceso</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-number">
              {solicitudes.filter(s => s.status === 'pendiente').length}
            </span>
            <span className="stat-label">Pendientes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-number">
              {solicitudes.filter(s => s.status === 'aprobada').length}
            </span>
            <span className="stat-label">Aprobadas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <span className="stat-number">
              {solicitudes.filter(s => s.status === 'rechazada').length}
            </span>
            <span className="stat-label">Rechazadas</span>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filtros-section">
        <div className="filtros-left">
          <select 
            value={filtro} 
            onChange={(e) => setFiltro(e.target.value)}
            className="filtro-select"
          >
            <option value="todas">Todas las solicitudes</option>
            <option value="en_proceso">En proceso</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
        <div className="filtros-right">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, matrícula o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="busqueda-input"
          />
        </div>
      </div>

      {/* Lista de Solicitudes */}
      <div className="solicitudes-list">
        {solicitudesFiltradas.length === 0 ? (
          <div className="no-data">
            <p>📝 No hay solicitudes que coincidan con los filtros</p>
            <p className="hint">
              {solicitudes.length === 0 
                ? 'No hay solicitudes registradas en el sistema' 
                : 'Prueba cambiando los filtros de búsqueda'
              }
            </p>
          </div>
        ) : (
          solicitudesFiltradas.map((solicitud) => (
            <div key={solicitud.id} className="solicitud-card">
              <div className="solicitud-header">
                <div className="solicitud-info">
                  <h3>{solicitud.student_name}</h3>
                  <div className="solicitud-meta">
                    <span className="matricula">🎓 {solicitud.student_matricula}</span>
                    <span className="fecha">📅 {new Date(solicitud.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
                <div 
                  className="estado-badge"
                  style={{ backgroundColor: getEstadoColor(solicitud.status) }}
                >
                  {getEstadoTexto(solicitud.status)}
                </div>
              </div>

              <div className="solicitud-details">
                {solicitud.description && (
                  <div className="detail-item">
                    <strong>Descripción:</strong> {solicitud.description}
                  </div>
                )}
                {solicitud.file_url && (
                  <div className="detail-item">
                    <strong>Archivo:</strong> {solicitud.file_url.split('/').pop()}
                  </div>
                )}
                {solicitud.review_comments && (
                  <div className="detail-item">
                    <strong>Comentario:</strong> 
                    <span style={{color: '#ef4444', fontStyle: 'italic'}}>
                      {solicitud.review_comments}
                    </span>
                  </div>
                )}
                {solicitud.review_date && (
                  <div className="detail-item">
                    <strong>Revisado:</strong> {new Date(solicitud.review_date).toLocaleDateString('es-ES')} por {solicitud.reviewed_by_name || 'N/A'}
                  </div>
                )}
              </div>

              <div className="solicitud-actions">
                <button 
                  className="btn-ver"
                  onClick={() => abrirModalDetalles(solicitud)}
                >
                  👁️ Ver Detalles
                </button>
                
                {solicitud.file_url && (
                  <a
                    href={solicitud.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-descargar"
                  >
                    📥 Descargar
                  </a>
                )}

                {(solicitud.status === 'pendiente' || solicitud.status === 'en_proceso') && (
                  <>
                    <button 
                      className="btn-aprobar"
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de que deseas aprobar la solicitud de ${solicitud.student_name}?`)) {
                          cambiarEstadoSolicitud(solicitud.id, 'aprobada');
                        }
                      }}
                      disabled={procesando}
                    >
                      ✅ Aprobar
                    </button>
                    <button 
                      className="btn-rechazar"
                      onClick={() => abrirModalRechazo(solicitud)}
                      disabled={procesando}
                    >
                      ❌ Rechazar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Detalles */}
      {modalTipo === 'detalles' && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles de la Solicitud</h2>
              <button className="btn-cerrar" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="solicitud-detalle">
                <h3>{solicitudSeleccionada.student_name}</h3>
                
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <strong>Estudiante:</strong> {solicitudSeleccionada.student_name}
                  </div>
                  <div className="detalle-item">
                    <strong>Matrícula:</strong> {solicitudSeleccionada.student_matricula}
                  </div>
                  <div className="detalle-item">
                    <strong>Fecha:</strong> {new Date(solicitudSeleccionada.created_at).toLocaleDateString('es-ES')}
                  </div>
                  {solicitudSeleccionada.file_url && (
                    <div className="detalle-item">
                      <strong>Archivo:</strong> {solicitudSeleccionada.file_url.split('/').pop()}
                    </div>
                  )}
                  <div className="detalle-item">
                    <strong>Estado:</strong> 
                    <span 
                      className="estado-text"
                      style={{ color: getEstadoColor(solicitudSeleccionada.status) }}
                    >
                      {getEstadoTexto(solicitudSeleccionada.status)}
                    </span>
                  </div>
                  {solicitudSeleccionada.reviewed_by_name && (
                    <div className="detalle-item">
                      <strong>Revisado por:</strong> {solicitudSeleccionada.reviewed_by_name}
                    </div>
                  )}
                  {solicitudSeleccionada.review_date && (
                    <div className="detalle-item">
                      <strong>Fecha de revisión:</strong> {new Date(solicitudSeleccionada.review_date).toLocaleDateString('es-ES')}
                    </div>
                  )}
                </div>

                {solicitudSeleccionada.description && (
                  <div className="detail-item">
                    <strong>Descripción:</strong>
                    <p style={{marginTop: '0.5rem', lineHeight: '1.5', background: '#f8fafc', padding: '1rem', borderRadius: '6px'}}>
                      {solicitudSeleccionada.description}
                    </p>
                  </div>
                )}

                {solicitudSeleccionada.review_comments && (
                  <div className="detail-item">
                    <strong>Comentario:</strong>
                    <p style={{
                      marginTop: '0.5rem', 
                      color: '#ef4444', 
                      fontStyle: 'italic',
                      background: '#fef2f2',
                      padding: '1rem',
                      borderRadius: '6px'
                    }}>
                      {solicitudSeleccionada.review_comments}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={cerrarModal}>
                Cerrar
              </button>
              {(solicitudSeleccionada.status === 'pendiente' || solicitudSeleccionada.status === 'en_proceso') && (
                <>
                  <button 
                    className="btn-aprobar"
                    onClick={() => {
                      if (window.confirm(`¿Aprobar solicitud de ${solicitudSeleccionada.student_name}?`)) {
                        cambiarEstadoSolicitud(solicitudSeleccionada.id, 'aprobada');
                      }
                    }}
                    disabled={procesando}
                  >
                    ✅ Aprobar
                  </button>
                  <button 
                    className="btn-rechazar"
                    onClick={() => {
                      cerrarModal();
                      abrirModalRechazo(solicitudSeleccionada);
                    }}
                    disabled={procesando}
                  >
                    ❌ Rechazar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Rechazo */}
      {modalTipo === 'rechazo' && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rechazar Solicitud</h2>
              <button className="btn-cerrar" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="solicitud-detalle">
                <p style={{marginBottom: '1rem'}}>
                  Estás a punto de rechazar la solicitud de <strong>{solicitudSeleccionada.student_name}</strong>
                </p>
                {solicitudSeleccionada.description && (
                  <p style={{
                    backgroundColor: '#f3f4f6',
                    padding: '1rem',
                    borderRadius: '6px',
                    marginBottom: '1.5rem',
                    fontWeight: '600'
                  }}>
                    "{solicitudSeleccionada.description}"
                  </p>
                )}

                <div className="comentario-section">
                  <label htmlFor="comentario">
                    📝 Motivo del rechazo (obligatorio):
                  </label>
                  <textarea
                    id="comentario"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Explica detalladamente los motivos del rechazo de esta solicitud..."
                    rows="4"
                    className="comentario-textarea"
                  />
                  <small style={{color: '#6b7280', display: 'block', marginTop: '0.5rem'}}>
                    Este comentario será visible para el estudiante.
                  </small>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={cerrarModal}>
                Cancelar
              </button>
              <button 
                className="btn-confirmar-rechazo"
                onClick={() => {
                  if (!comentario.trim()) {
                    alert('⚠️ Por favor, agrega un comentario explicando el motivo del rechazo.');
                    return;
                  }
                  if (window.confirm('¿Confirmas el rechazo de esta solicitud?')) {
                    cambiarEstadoSolicitud(solicitudSeleccionada.id, 'rechazada', comentario);
                  }
                }}
                disabled={!comentario.trim() || procesando}
              >
                ❌ Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionSolicitud;
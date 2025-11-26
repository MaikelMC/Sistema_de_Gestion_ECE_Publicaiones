// src/pages/Tutor/OpinionesTutor/OpinionesTutor.jsx - INTEGRADO CON BACKEND
import './OpinionesTutor.css';
import React, { useState, useEffect } from 'react';
import tutorService from '../../../services/tutorService';

function OpinionesTutor() {
  const [publicacionesPendientes, setPublicacionesPendientes] = useState([]);
  const [opinionesEmitidas, setOpinionesEmitidas] = useState([]);
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [opinion, setOpinion] = useState('');
  const [recomendacion, setRecomendacion] = useState('aprobada');
  const [filtro, setFiltro] = useState('todas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar publicaciones pendientes de opinión
      const pendientes = await tutorService.getPendingPublications();
      setPublicacionesPendientes(pendientes);

      // Cargar opiniones ya emitidas
      const opiniones = await tutorService.getMyOpinions();
      setOpinionesEmitidas(opiniones);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const emitirOpinion = async (publicacionId) => {
    if (!opinion.trim()) {
      alert('Por favor, escribe tu opinión antes de enviar.');
      return;
    }

    try {
      setLoading(true);

      // Enviar opinión al backend
      await tutorService.createOpinion(publicacionId, {
        opinion: opinion,
        recommendation: recomendacion
      });

      alert('✅ Opinión emitida correctamente');
      
      // Recargar datos
      await cargarDatos();
      
      // Resetear formulario
      setPublicacionSeleccionada(null);
      setOpinion('');
      setRecomendacion('aprobada');

    } catch (err) {
      console.error('Error al emitir opinión:', err);
      alert('❌ Error al emitir la opinión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const filtrarOpiniones = () => {
    if (filtro === 'todas') return opinionesEmitidas;
    return opinionesEmitidas.filter(op => op.recommendation === filtro);
  };

  const getRecomendacionColor = (recomendacion) => {
    switch (recomendacion) {
      case 'aprobada': return '#10b981';
      case 'rechazada': return '#ef4444';
      case 'revision': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getRecomendacionTexto = (recomendacion) => {
    switch (recomendacion) {
      case 'aprobada': return '✅ Aprobar';
      case 'rechazada': return '❌ Rechazar';
      case 'revision': return '📝 Requiere Revisión';
      default: return '📌 Pendiente';
    }
  };

  const opinionesFiltradas = filtrarOpiniones();

  return (
    <div className="opiniones-tutor">
      <header className="page-header">
        <h1>💭 Opiniones de Tutor</h1>
        <p>Emite opiniones y recomendaciones sobre las publicaciones de tus estudiantes</p>
      </header>

      {/* Error */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={cargarDatos} className="btn-retry">Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>⏳ Cargando datos...</p>
        </div>
      )}

      {!loading && !error && (
        <>
      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <span className="stat-number">{publicacionesPendientes.length}</span>
            <span className="stat-label">Pendientes de Opinión</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-number">
              {opinionesEmitidas.filter(op => op.recommendation === 'aprobada').length}
            </span>
            <span className="stat-label">Aprobadas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-number">
              {opinionesEmitidas.filter(op => op.recommendation === 'revision').length}
            </span>
            <span className="stat-label">Con Modificaciones</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <span className="stat-number">
              {opinionesEmitidas.filter(op => op.recommendation === 'rechazada').length}
            </span>
            <span className="stat-label">Rechazadas</span>
          </div>
        </div>
      </div>

      <div className="opiniones-grid">
        {/* Publicaciones Pendientes */}
        <section className="card pendientes-section">
          <div className="section-header">
            <h2>📋 Publicaciones Pendientes de Opinión</h2>
            <span className="badge">{publicacionesPendientes.length}</span>
          </div>

          {publicacionesPendientes.length === 0 ? (
            <div className="no-data">
              <p>🎉 No hay publicaciones pendientes de opinión</p>
              <p className="hint">Todas las publicaciones han sido revisadas</p>
            </div>
          ) : (
            <div className="publicaciones-list">
              {publicacionesPendientes.map(publicacion => (
                <div key={publicacion.id} className="publicacion-item">
                  <div className="publicacion-header">
                    <h3>{publicacion.titulo || publicacion.title}</h3>
                    <span className="nivel-badge">Nivel {publicacion.nivel}</span>
                  </div>
                  
                  <div className="publicacion-info">
                    <div className="info-item">
                      <strong>Estudiante:</strong> {publicacion.student_name || 'No especificado'}
                    </div>
                    <div className="info-item">
                      <strong>Matrícula:</strong> {publicacion.student_matricula || 'No especificada'}
                    </div>
                    <div className="info-item">
                      <strong>Fecha:</strong> {publicacion.fecha_publicacion || publicacion.publication_date || 'No especificada'}
                    </div>
                    <div className="info-item">
                      <strong>Archivo:</strong> 
                      {publicacion.file_url ? (
                        <a href={publicacion.file_url} target="_blank" rel="noopener noreferrer"> 📎 Ver documento</a>
                      ) : (
                        ' No disponible'
                      )}
                    </div>
                  </div>

                  <div className="publicacion-resumen">
                    <strong>Resumen:</strong>
                    <p>{publicacion.resumen || publicacion.abstract || 'No especificado'}</p>
                  </div>

                  <div className="publicacion-actions">
                    <button 
                      className="btn-opinar"
                      onClick={() => setPublicacionSeleccionada(publicacion)}
                    >
                      📝 Emitir Opinión
                    </button>
                    {publicacion.file_url && (
                      <a 
                        href={publicacion.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-descargar"
                      >
                        👍 Descargar
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Opiniones Emitidas */}
        <section className="card emitidas-section">
          <div className="section-header">
            <h2>📊 Historial de Opiniones</h2>
            <select 
              value={filtro} 
              onChange={(e) => setFiltro(e.target.value)}
              className="filtro-select"
            >
              <option value="todas">Todas las opiniones</option>
              <option value="aprobada">Solo aprobadas</option>
              <option value="revision">Requiere Revisión</option>
              <option value="rechazada">Solo rechazadas</option>
            </select>
          </div>

          {opinionesFiltradas.length === 0 ? (
            <div className="no-data">
              <p>📝 No hay opiniones emitidas</p>
              <p className="hint">Las opiniones que emitas aparecerán aquí</p>
            </div>
          ) : (
            <div className="opiniones-list">
              {opinionesFiltradas.map(opinionItem => (
                <div key={opinionItem.id} className="opinion-item">
                  <div className="opinion-header">
                    <h3>{opinionItem.publication_title}</h3>
                    <div 
                      className="recomendacion-badge"
                      style={{ backgroundColor: getRecomendacionColor(opinionItem.recommendation) }}
                    >
                      {opinionItem.recommendation_display || getRecomendacionTexto(opinionItem.recommendation)}
                    </div>
                  </div>
                  
                  <div className="opinion-meta">
                    <span><strong>Opinión emitida:</strong> {new Date(opinionItem.created_at).toLocaleDateString('es-ES')}</span>
                  </div>

                  <div className="opinion-content">
                    <strong>Opinión del tutor:</strong>
                    <p>{opinionItem.opinion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal para Emitir Opinión */}
      {publicacionSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📝 Emitir Opinión</h2>
              <button 
                className="btn-cerrar"
                onClick={() => {
                  setPublicacionSeleccionada(null);
                  setOpinion('');
                  setRecomendacion('aprobada');
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="publicacion-info-modal">
                <h3>{publicacionSeleccionada.title || publicacionSeleccionada.titulo}</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Estudiante:</strong> {publicacionSeleccionada.student_name}
                  </div>
                  <div className="info-item">
                    <strong>Matrícula:</strong> {publicacionSeleccionada.student_matricula}
                  </div>
                  <div className="info-item">
                    <strong>Nivel:</strong> Nivel {publicacionSeleccionada.nivel}
                  </div>
                  {publicacionSeleccionada.journal && (
                    <div className="info-item">
                      <strong>Revista:</strong> {publicacionSeleccionada.journal}
                    </div>
                  )}
                </div>
                
                <div className="resumen-section">
                  <strong>Resumen:</strong>
                  <p>{publicacionSeleccionada.abstract || publicacionSeleccionada.resumen || 'Sin resumen'}</p>
                </div>
              </div>

              <div className="opinion-form">
                <div className="form-group">
                  <label htmlFor="recomendacion">Recomendación:</label>
                  <select
                    id="recomendacion"
                    value={recomendacion}
                    onChange={(e) => setRecomendacion(e.target.value)}
                    className="inputr"
                    disabled={loading}
                  >
                    <option value="aprobada">✅ Aprobar publicación</option>
                    <option value="revision">📝 Requiere revisión</option>
                    <option value="rechazada">❌ Rechazar publicación</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="opinion">Opinión detallada:</label>
                  <textarea
                    id="opinion"
                    value={opinion}
                    onChange={(e) => setOpinion(e.target.value)}
                    placeholder="Escribe tu opinión detallada sobre la publicación. Incluye fortalezas, áreas de mejora, recomendaciones específicas..."
                    rows="6"
                    className="opinion-textarea"
                  />
                  <small>Mínimo 50 caracteres. Sé específico y constructivo.</small>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-confirmar"
                onClick={() => emitirOpinion(publicacionSeleccionada.id)}
                disabled={opinion.length < 50 || loading}
              >
                {loading ? '⏳ Enviando...' : '📨 Enviar Opinión'}
              </button>
              <button 
                className="btn-cancelar"
                onClick={() => {
                  setPublicacionSeleccionada(null);
                  setOpinion('');
                  setRecomendacion('aprobada');
                }}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default OpinionesTutor;
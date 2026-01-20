import './MisAlumnos.css';
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { config } from '../../../config/config';

function MisAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');

  // Derived helpers for publication preview
  const fileUrl = selectedPublication ? (selectedPublication.file_url || selectedPublication.archivo) : null;
  const isPdf = fileUrl ? String(fileUrl).toLowerCase().endsWith('.pdf') : false;

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener estudiantes asignados al tutor
      const tutorStudentsUrl = `${config.endpoints.PUBLICATIONS.replace(/\/$/, '')}/${config.endpoints.TUTOR_STUDENTS_MY.replace(/^\//, '')}`;
      const response = await api.get(tutorStudentsUrl);
      
      // Transformar datos para incluir información adicional
      const alumnosData = await Promise.all(
        response.data.map(async (relation) => {
          // relation may include student as an id (number) and student_name, etc.
          const studentId = relation.student && typeof relation.student === 'object'
            ? relation.student.id
            : relation.student;

          const nombre = relation.student_name || (
            relation.student && relation.student.first_name && relation.student.last_name
              ? `${relation.student.first_name} ${relation.student.last_name}`
              : (relation.student && relation.student.username) || 'Usuario'
          );

          const email = relation.student_email || (relation.student && relation.student.email) || '';
          const estado = relation.is_active ? 'Activo' : 'Inactivo';
          const fechaAsignacion = relation.assigned_date;

          try {
            if (!studentId) {
              // No tenemos id válido, devolver registro básico
              throw new Error('student id no disponible');
            }

            // Obtener publicaciones del estudiante
            const pubsResponse = await api.get(`/publications/?student=${studentId}`);

            return {
              id: studentId,
              nombre,
              email,
              estado,
              fechaAsignacion,
              publicacionesEnviadas: Array.isArray(pubsResponse.data) ? pubsResponse.data.length : (pubsResponse.data.results ? pubsResponse.data.results.length : 0),
              ultimaActividad: (Array.isArray(pubsResponse.data) ? pubsResponse.data : (pubsResponse.data.results || [])).length > 0
                ? new Date(Math.max(...(Array.isArray(pubsResponse.data) ? pubsResponse.data : (pubsResponse.data.results || [])).map(p => new Date(p.created_at)))).toISOString().split('T')[0]
                : 'Sin actividad',
              progreso: Math.min(100, (Array.isArray(pubsResponse.data) ? pubsResponse.data.length : (pubsResponse.data.results ? pubsResponse.data.results.length : 0)) * 25) // 4 publicaciones = 100%
            };
          } catch (err) {
            console.error(`Error al cargar datos del estudiante ${studentId}:`, err);
            return {
              id: studentId || Math.random(),
              nombre,
              email,
              estado,
              fechaAsignacion,
              publicacionesEnviadas: 0,
              ultimaActividad: 'Sin actividad',
              progreso: 0
            };
          }
        })
      );
      
      setAlumnos(alumnosData);
    } catch (err) {
      console.error('Error al cargar alumnos:', err);
      setError('Error al cargar los estudiantes. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const filtrarAlumnos = () => {
    if (filtro === 'todos') return alumnos;
    return alumnos.filter(alumno => alumno.estado === filtro);
  };

  const getEstadoColor = (estado) => {
    return estado === 'Activo' ? '#10b981' : '#6b7280';
  };

  const abrirModalPublicaciones = async (alumno) => {
    if (!alumno || !alumno.id) return;
    setSelectedStudent(alumno);
    setModalOpen(true);
    try {
      // solicitar publicaciones del estudiante
      const resp = await api.get(`/publications/?student=${alumno.id}`);
      const pubs = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setPublicaciones(pubs);
    } catch (err) {
      console.error('Error cargando publicaciones del alumno:', err);
      setPublicaciones([]);
    }
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
    setPublicaciones([]);
  };

  return (
    <div className="mis-alumnos-page">
      <header className="page-header">
        <h1>👥 Mis Alumnos</h1>
        <p>Gestiona y realiza seguimiento a tus alumnos asignados</p>
      </header>

      {/* Error */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={cargarAlumnos} className="btn-retry">
            Reintentar
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>⏳ Cargando alumnos...</p>
        </div>
      )}

      {/* Contenido */}
      {!loading && !error && (
        <>
          {/* Filtros */}
          <div className="filtros-section">
            <select 
              value={filtro} 
              onChange={(e) => setFiltro(e.target.value)}
              className="filtro-select"
            >
              <option value="todos">Todos los alumnos ({alumnos.length})</option>
              <option value="Activo">Solo activos ({alumnos.filter(a => a.estado === 'Activo').length})</option>
              <option value="Inactivo">Solo inactivos ({alumnos.filter(a => a.estado === 'Inactivo').length})</option>
            </select>
            <button onClick={cargarAlumnos} className="btn-refresh" title="Recargar">
              🔄 Recargar
            </button>
          </div>

          {/* Lista de Alumnos */}
          {filtrarAlumnos().length === 0 ? (
            <div className="no-alumnos">
              <p>📝 No tienes alumnos asignados aún</p>
            </div>
          ) : (
            <div className="alumnos-list">
              {filtrarAlumnos().map(alumno => (
                <div key={alumno.id} className="alumno-card">
                  <div className="alumno-header">
                    <div className="alumno-info">
                      <h3>{alumno.nombre}</h3>
                      <div className="alumno-meta">
                        <span className="email">✉️ {alumno.email}</span>
                      </div>
                    </div>
                    <div 
                      className="estado-badge"
                      style={{ backgroundColor: getEstadoColor(alumno.estado) }}
                    >
                      {alumno.estado}
                    </div>
                  </div>
                  <div className="alumno-details">            
                    <div className="progreso-section">
                      <div className="progreso-header">
                        <span>Progreso ECE</span>
                        <span>{alumno.progreso}%</span>
                      </div>
                      <div className="progreso-bar">
                        <div 
                          className="progreso-fill"
                          style={{ width: `${alumno.progreso}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="alumno-actions">
                    <button
                      className="btn-ver"
                      onClick={() => abrirModalPublicaciones(alumno)}
                      aria-label={`Ver publicaciones de ${alumno.nombre}`}
                    >
                      Ver Publicaciones
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {modalOpen && selectedStudent && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Publicaciones de {selectedStudent.nombre}</h2>
              <button className="modal-close" onClick={cerrarModal}>✖</button>
            </div>
            <div className="modal-student-info">
              <p><strong>Nombre:</strong> {selectedStudent.nombre}</p>
              <p><strong>Email:</strong> {selectedStudent.email || 'N/A'}</p>
            </div>
            <div className="modal-publications">
              {selectedPublication ? (
                <div className="modal-publication-detail">
                  <div className="detail-header">
                    <div className="header-title">
                      <h3>{selectedPublication.title || selectedPublication.titulo || 'Sin título'}</h3>
                      <p>{selectedPublication.student_name || selectedStudent?.nombre || ''}</p>
                    </div>
                  </div>

                  <div className="meta-pills">
                    <span className="pill">{selectedPublication.nivel ? `Nivel ${selectedPublication.nivel}` : ''}</span>
                    <span className="pill">{selectedPublication.journal || selectedPublication.revista || ''}</span>
                    <span className="pill">{selectedPublication.publication_date || selectedPublication.fecha_publicacion || ''}</span>
                    {selectedPublication.status_display || selectedPublication.status ? (
                      <span className="pill estado">{selectedPublication.status_display || selectedPublication.status}</span>
                    ) : null}
                  </div>

                  <div className="detail-content">
                    <div className="content-left">
                      <div className="info-row">
                        <span className="info-label">Volumen:</span>
                        <span className="info-value">{selectedPublication.volume || selectedPublication.volumen || 'N/A'}</span>
                      </div>
                      {selectedPublication.pages || selectedPublication.paginas ? (
                        <div className="info-row">
                          <span className="info-label">Páginas:</span>
                          <span className="info-value">{selectedPublication.pages || selectedPublication.paginas}</span>
                        </div>
                      ) : null}
                      {selectedPublication.doi ? (
                        <div className="info-row">
                          <span className="info-label">DOI:</span>
                          <span className="info-value"><a href={`https://doi.org/${selectedPublication.doi}`} target="_blank" rel="noopener noreferrer">{selectedPublication.doi}</a></span>
                        </div>
                      ) : null}
                    </div>
                    <div className="resumen">
                      <strong>Resumen:</strong> {selectedPublication.abstract || selectedPublication.resumen || 'Sin resumen'}
                    </div>
                  </div>

                  {fileUrl && isPdf && (
                    <div className="doc-preview">
                      <iframe title="preview" src={fileUrl} frameBorder="0" />
                    </div>
                  )}

                  <div className="detail-footer">
                    <button className="btn-back" onClick={() => setSelectedPublication(null)}>← Volver a lista</button>
                    {fileUrl && (
                      <a href={fileUrl} className="btn-download" download>⬇️ Descargar</a>
                    )}
                  </div>
                </div>
              ) : (
                publicaciones.length === 0 ? (
                  <p>Sin publicaciones para este alumno.</p>
                ) : (
                  <ul>
                    {publicaciones.map(pub => (
                      <li key={pub.id} className="modal-publication-item">
                        <div className="pub-row">
                          <div className="pub-meta">
                            <h4>{pub.title || pub.titulo || 'Sin título'}</h4>
                            <p>{pub.journal || pub.revista || ''} — {pub.publication_date || pub.fecha_publicacion || ''}</p>
                          </div>
                          <div className="pub-actions">
                            <button className="btn-small" onClick={() => setSelectedPublication(pub)}>Ver detalle</button>
                            {(pub.file_url || pub.archivo) && (
                              <a href={pub.file_url || pub.archivo} target="_blank" rel="noopener noreferrer" className="btn-small" download>Descargar</a>
                            )}
                          </div>
                        </div>
                        <div className="pub-status"><strong>Estado:</strong> {pub.status_display || pub.status}</div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisAlumnos;
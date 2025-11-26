import './MisAlumnos.css';
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { config } from '../../../config/config';

function MisAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');

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
          try {
            // Obtener publicaciones del estudiante
            const pubsResponse = await api.get(`/publications/?student=${relation.student.id}`);
            
            return {
              id: relation.student.id,
              nombre: relation.student.first_name && relation.student.last_name
                ? `${relation.student.first_name} ${relation.student.last_name}`
                : relation.student.username,
              matricula: relation.student.matricula || 'N/A',
              email: relation.student.email,
              estado: relation.is_active ? 'Activo' : 'Inactivo',
              fechaAsignacion: relation.assigned_date,
              publicacionesEnviadas: pubsResponse.data.length,
              ultimaActividad: pubsResponse.data.length > 0 
                ? new Date(Math.max(...pubsResponse.data.map(p => new Date(p.created_at)))).toISOString().split('T')[0]
                : 'Sin actividad',
              progreso: Math.min(100, pubsResponse.data.length * 25) // 4 publicaciones = 100%
            };
          } catch (err) {
            console.error(`Error al cargar datos del estudiante ${relation.student.id}:`, err);
            return {
              id: relation.student.id,
              nombre: relation.student.first_name && relation.student.last_name
                ? `${relation.student.first_name} ${relation.student.last_name}`
                : relation.student.username,
              matricula: relation.student.matricula || 'N/A',
              email: relation.student.email,
              estado: relation.is_active ? 'Activo' : 'Inactivo',
              fechaAsignacion: relation.assigned_date,
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
                        <span className="matricula">📋 Matrícula: {alumno.matricula}</span>
                        <span className="email">✉️ {alumno.email}</span>
                        <span className="ultima-actividad">🕐 Última actividad: {alumno.ultimaActividad}</span>
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
                    <div className="publicaciones-info">
                      <span>📄 Publicaciones enviadas: <strong>{alumno.publicacionesEnviadas}</strong></span>
                    </div>
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
                    <button className="btn-ver-detalles">
                      Ver Publicaciones
                    </button>
                    <button className="btn-contactar">
                      📧 Contactar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MisAlumnos;
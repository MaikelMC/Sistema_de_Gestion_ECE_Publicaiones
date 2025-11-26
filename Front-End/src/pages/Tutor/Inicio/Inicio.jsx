import './Inicio.css';
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import tutorService from '../../../services/tutorService';
import { config } from '../../../config/config';

function InicioTutor() {
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    solicitudesPendientes: 0,
    opinionesEmitidas: 0,
    alumnosActivos: 0
  });

  const [actividadesRecientes, setActividadesRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener estadísticas del perfil del tutor
      const profileResponse = await api.get(config.endpoints.PROFILE);
      const profileStats = profileResponse.data.stats || {};

      // Obtener estudiantes y publicaciones pendientes
      const [estudiantes, publicaciones] = await Promise.all([
        tutorService.getMyStudents(),
        tutorService.getPendingPublications()
      ]);

      setStats({
        totalAlumnos: profileStats.mis_estudiantes || estudiantes.length || 0,
        solicitudesPendientes: publicaciones.length || 0,
        opinionesEmitidas: profileStats.opiniones_emitidas || 0,
        alumnosActivos: profileStats.mis_estudiantes || estudiantes.length || 0
      });

      // Obtener actividades recientes (publicaciones pendientes y opiniones recientes)
      const opiniones = await tutorService.getMyOpinions();
      
      const actividades = [
        ...publicaciones.slice(0, 2).map(pub => ({
          id: `pub-${pub.id}`,
          alumno: pub.student_name || pub.user?.get_full_name || 'Estudiante',
          tipo: 'Publicación',
          estado: 'Pendiente',
          fecha: pub.created_at
        })),
        ...opiniones.slice(0, 2).map(op => ({
          id: `op-${op.id}`,
          alumno: op.publication?.user?.get_full_name || 'Estudiante',
          tipo: 'Opinión Emitida',
          estado: op.recommendation === 'aprobada' ? 'Aprobada' : op.recommendation === 'rechazada' ? 'Rechazada' : 'Revisión',
          fecha: op.created_at
        }))
      ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 4);

      setActividadesRecientes(actividades);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('No se pudieron cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX');
  };

  if (loading) {
    return (
      <div className="inicio-tutor-page">
        <header className="page-header">
          <h1>⏳ Cargando...</h1>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inicio-tutor-page">
        <header className="page-header">
          <h1>⚠️ Bienvenido Tutor</h1>
          <p>{error}</p>
        </header>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <button onClick={cargarDatos} className="btn-primario">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inicio-tutor-page">
      <header className="page-header">
        <h1>👨‍🏫 Bienvenido Tutor</h1>
        <p>Bienvenido al panel de control del tutor</p>
      </header>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <span className="stat-number">{stats.totalAlumnos}</span>
            <span className="stat-label">Total Alumnos</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-number">{stats.solicitudesPendientes}</span>
            <span className="stat-label">Solicitudes Pendientes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-number">{stats.opinionesEmitidas}</span>
            <span className="stat-label">Opiniones Emitidas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-number">{stats.alumnosActivos}</span>
            <span className="stat-label">Alumnos Activos</span>
          </div>
        </div>
      </div>

      {/* Actividades Recientes */}
      <div className="recent-activities card">
        <h2>Actividades Recientes</h2>
        <div className="activities-list">
          {actividadesRecientes.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              No hay actividades recientes
            </p>
          ) : (
            actividadesRecientes.map(actividad => (
              <div key={actividad.id} className="activity-item">
                <div className="activity-icon">
                  {actividad.tipo === 'Solicitud ECE' ? '📝' : 
                   actividad.tipo === 'Publicación' ? '📄' : '✅'}
                </div>
                <div className="activity-content">
                  <h4>{actividad.alumno}</h4>
                  <p>{actividad.tipo} - {actividad.estado}</p>
                  <span className="activity-date">{formatearFecha(actividad.fecha)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default InicioTutor;
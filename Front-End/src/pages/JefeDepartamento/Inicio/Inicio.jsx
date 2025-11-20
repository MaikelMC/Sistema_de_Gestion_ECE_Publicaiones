// src/pages/JefeDepartamento/Inicio/Inicio.jsx - INTEGRADO CON BACKEND
import './Inicio.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

function Inicio() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Obtener usuario actual del hook
  const [statsData, setStatsData] = useState({
    solicitudesPendientes: 0,
    solicitudesAprobadas: 0,
    solicitudesRechazadas: 0,
    publicacionesRegistradas: 0,
    estudiantesActivos: 0,
    promedioAprobacion: 0
  });
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recargar estadísticas cuando cambia el usuario
  useEffect(() => {
    if (user) {
      console.log('🔄 Usuario cambió, recargando estadísticas:', user.username);
      cargarEstadisticas();
    }
  }, [user]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener primero los datos del usuario actual
      const meResponse = await api.get('/auth/users/me/');
      const jefeId = meResponse.data.id;
      
      console.log('👤 Usuario logueado en Inicio:');
      console.log('   - ID:', jefeId);
      console.log('   - Nombre:', meResponse.data.get_full_name || meResponse.data.username);
      console.log('   - Email:', meResponse.data.email);

      // Cargar estudiantes y solicitudes revisadas por ESTE jefe
      console.log(`🔍 Buscando solicitudes con reviewed_by=${jefeId}`);
      const [estudiantesRes, solicitudesRes, publicacionesRes] = await Promise.all([
        api.get('/auth/users/?role=estudiante'),
        api.get(`/ece-requests/?reviewed_by=${jefeId}`),
        api.get('/publications/stats/')
      ]);

      const listaEstudiantes = estudiantesRes.data.results || estudiantesRes.data || [];
      const listaSolicitudes = Array.isArray(solicitudesRes.data) 
        ? solicitudesRes.data 
        : solicitudesRes.data.results || [];
      
      console.log('📋 Datos de estudiantes recibidos:', listaEstudiantes.length);
      console.log('📊 Solicitudes del jefe:', listaSolicitudes);
      console.log('📊 Cantidad total:', listaSolicitudes.length);
      
      // Mostrar detalles de cada solicitud
      listaSolicitudes.forEach((sol, index) => {
        console.log(`   Solicitud ${index + 1}:`, {
          id: sol.id,
          estudiante: sol.estudiante_nombre,
          status: sol.status,
          reviewed_by_id: sol.reviewed_by,
          reviewed_by_name: sol.reviewed_by_name
        });
      });
      
      // Contar solicitudes por estado que ESTE jefe ha revisado
      const aprobadas = listaSolicitudes.filter(s => s.status === 'aprobada').length;
      const rechazadas = listaSolicitudes.filter(s => s.status === 'rechazada').length;
      const pendientes = listaSolicitudes.filter(s => s.status === 'pendiente').length;
      
      console.log('Conteo:', { aprobadas, rechazadas, pendientes }); // Debug
      
      // Calcular tasa de aprobación
      const total = aprobadas + rechazadas;
      const tasaAprobacion = total > 0 ? Math.round((aprobadas / total) * 100) : 0;
      
      setStatsData({
        solicitudesPendientes: pendientes,
        solicitudesAprobadas: aprobadas,
        solicitudesRechazadas: rechazadas,
        publicacionesRegistradas: publicacionesRes.data.total || 0,
        estudiantesActivos: listaEstudiantes.length,
        promedioAprobacion: tasaAprobacion
      });

      setEstudiantes(listaEstudiantes);

    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar las estadísticas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jefe-dash-page">
      <header className="jefe-panel-header">
        <img src="/Imagenes/logouci.webp" alt="Logo UCI" className="jefe-profile-photo" />
        <div>
          <h1>Bienvenido Jefe de Departamento</h1>
          <p className="jefe-welcome-subtitle">Sistema de Gestión ECE - Vista Administrativa</p>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={cargarEstadisticas} className="btn-retry">Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>⏳ Cargando estadísticas...</p>
        </div>
      ) : (
        <>
      {/* Tarjetas de Estadísticas Rápidas */}
      <section className="jefe-stats-grid">
        <div className="jefe-stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>{statsData.solicitudesPendientes}</h3>
            <p>Solicitudes Pendientes</p>
          </div>
        </div>
        
        <div className="jefe-stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{statsData.solicitudesAprobadas}</h3>
            <p>Solicitudes Aprobadas</p>
          </div>
        </div>
        
        <div className="jefe-stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>{statsData.solicitudesRechazadas}</h3>
            <p>Solicitudes Rechazadas</p>
          </div>
        </div>
        
        <div className="jefe-stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <h3>{statsData.publicacionesRegistradas}</h3>
            <p>Publicaciones Registradas</p>
          </div>
        </div>
        
        <div className="jefe-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{statsData.estudiantesActivos}</h3>
            <p>Estudiantes Activos</p>
          </div>
        </div>
        
        <div className="jefe-stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{statsData.promedioAprobacion}%</h3>
            <p>Tasa de Aprobación</p>
          </div>
        </div>
      </section>

      {/* Accesos Rápidos - Ancho completo */}
      <section className="jefe-card accesos-rapidos-card-full">
        <h2>⚡ Accesos Rápidos</h2>
        <div className="accesos-rapidos-grid">
          <div 
            className="acceso-rapido-item clickable"
            onClick={() => navigate('/jefe/gestion-solicitudes')}
          >
            <div className="acceso-icon">📝</div>
            <div className="acceso-content">
              <p><strong>Gestión de Solicitudes</strong></p>
              <small>Revisar y aprobar solicitudes ECE</small>
            </div>
            <div className="acceso-arrow">→</div>
          </div>
          <div 
            className="acceso-rapido-item clickable"
            onClick={() => navigate('/jefe/gestion-publicaciones')}
          >
            <div className="acceso-icon">📄</div>
            <div className="acceso-content">
              <p><strong>Gestión de Publicaciones</strong></p>
              <small>Clasificar publicaciones por nivel</small>
            </div>
            <div className="acceso-arrow">→</div>
          </div>
        </div>
      </section>

      {/* Lista de Estudiantes Activos */}
      <section className="jefe-card" style={{ marginTop: '2rem' }}>
        <h2>👥 Estudiantes Activos en el Sistema</h2>
        {estudiantes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No hay estudiantes registrados en el sistema
          </p>
        ) : (
          <div className="estudiantes-grid">
            {estudiantes.map((estudiante) => (
              <div key={estudiante.id} className="estudiante-card">
                <div className="estudiante-info">
                  <h4>
                    {estudiante.first_name && estudiante.last_name 
                      ? `${estudiante.first_name} ${estudiante.last_name}`
                      : estudiante.full_name || estudiante.username || 'Sin nombre'
                    }
                  </h4>
                  <p className="estudiante-matricula">📋 {estudiante.matricula || 'Sin matrícula'}</p>
                  <p className="estudiante-email">✉️ {estudiante.email}</p>
                </div>
                <div className="estudiante-stats">
                  <span className="badge">👤 Estudiante</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}

export default Inicio;
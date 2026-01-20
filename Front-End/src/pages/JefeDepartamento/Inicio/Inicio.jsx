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
    estudiantesActivos: 0
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

    const handler = () => {
      console.log('📣 Notificación de usuarios actualizados recibida — recargando estudiantes');
      cargarEstadisticas();
    };

    // Escuchar eventos cross-tab y en la misma pestaña
    window.addEventListener('storage', (e) => {
      if (e.key === 'users_updated') handler();
    });
    window.addEventListener('users_updated', handler);

    return () => {
      window.removeEventListener('users_updated', handler);
    };
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
        api.get('/auth/users/', { params: { role: 'estudiante', t: Date.now() } }),
        api.get(`/requests/`, { params: { reviewed_by: jefeId, t: Date.now() } }),
        api.get('/publications/stats/', { params: { t: Date.now() } })
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

      // Normalizar conteo de publicaciones de la posible respuesta de /publications/stats/
      const pubsData = publicacionesRes?.data || {};
      const publicacionesCount = (pubsData.total ?? pubsData.count ?? pubsData.total_results ?? (Array.isArray(pubsData.results) ? pubsData.results.length : 0)) || 0;

      setStatsData({
        solicitudesPendientes: pendientes,
        solicitudesAprobadas: aprobadas,
        solicitudesRechazadas: rechazadas,
        publicacionesRegistradas: publicacionesCount,
        estudiantesActivos: listaEstudiantes.length
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
          <p className="jefe-welcome-subtitle">Vista Administrativa</p>
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
      {/* Tarjetas de Estadísticas Rápidas (usando estilos compartidos de stats) */}
      <section className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-number">{statsData.solicitudesPendientes}</div>
            <div className="stat-label">Solicitudes Pendientes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{statsData.solicitudesAprobadas}</div>
            <div className="stat-label">Solicitudes Aprobadas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <div className="stat-number">{statsData.solicitudesRechazadas}</div>
            <div className="stat-label">Solicitudes Rechazadas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <div className="stat-number">{statsData.publicacionesRegistradas}</div>
            <div className="stat-label">Publicaciones Registradas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-number">{statsData.estudiantesActivos}</div>
            <div className="stat-label">Estudiantes Activos</div>
          </div>
        </div>

        {/* Tasa de Aprobación eliminada */}
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
                  <p className="estudiante-anno">📋 Año  {estudiante.anno || 'Sin año'}</p>
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
// src/pages/Admin/InicioAdmin/InicioAdmin.jsx - INTEGRADO CON BACKEND
import './InicioAdmin.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

function InicioAdmin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { title: 'Total Usuarios', value: '0', icon: '👥', color: '#c3c7ddff' },
    { title: 'Solicitudes Activas', value: '0', icon: '📋', color: '#c3c7ddff' },
    { title: 'Publicaciones', value: '0', icon: '📄', color: '#c3c7ddff' },
    { title: 'Tutores Activos', value: '0', icon: '👨‍🏫', color: '#c3c7ddff' },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar estadísticas de usuarios, solicitudes y publicaciones
      const [usuariosRes, solicitudesRes, publicacionesRes] = await Promise.all([
        api.get('/auth/users/stats/'),
        api.get('/ece-requests/stats/'),
        api.get('/publications/stats/')
      ]);

      setStats([
        { title: 'Total Usuarios', value: usuariosRes.data.total.toString(), icon: '👥', color: '#c3c7ddff' },
        { title: 'Solicitudes Activas', value: solicitudesRes.data.pendientes.toString(), icon: '📋', color: '#c3c7ddff' },
        { title: 'Publicaciones', value: publicacionesRes.data.total.toString(), icon: '📄', color: '#c3c7ddff' },
        { title: 'Tutores Activos', value: (usuariosRes.data.por_rol?.tutor || 0).toString(), icon: '👨‍🏫', color: '#c3c7ddff' },
      ]);

    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar las estadísticas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dash-page">
      <header className="panel-header">
        <h1>Panel de Administración</h1>
        <p className="welcome-subtitle">Gestión completa del sistema</p>
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
      <section className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ background: stat.color }}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="admin-content-grid">
        <section className="card card-clickable" onClick={() => navigate('/admin/usuarios')}>
          <h2>👥 Gestión de Usuarios</h2>
          <p className="card-description">Administrar todos los usuarios del sistema</p>
          <div className="card-footer">
            <span className="card-link">Ir a Usuarios →</span>
          </div>
        </section>

        <section className="card card-clickable" onClick={() => navigate('/admin/logs')}>
          <h2>📝 Logs del Sistema</h2>
          <p className="card-description">Revisar actividad y auditoría</p>
          <div className="card-footer">
            <span className="card-link">Ver Logs →</span>
          </div>
        </section>
      </div>
        </>
      )}
    </div>
  );
}

export default InicioAdmin;
// src/pages/JefeDepartamento/PerfilJefe/PerfilJefe.jsx
import './PerfilJefe.css';
import './PerfilJefe_modal.css';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

function PerfilJefe() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [modalDetalles, setModalDetalles] = useState(false);

  // Cargar perfil y estadísticas del jefe
  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar datos del usuario
      const response = await api.get('/auth/users/me/');
      console.log('👤 Usuario logueado:', response.data);
      console.log('   - ID:', response.data.id);
      console.log('   - Nombre:', response.data.get_full_name || response.data.username);
      console.log('   - Email:', response.data.email);
      
      setUserData({
        nombre: response.data.get_full_name || `${response.data.first_name} ${response.data.last_name}`.trim() || response.data.username,
        email: response.data.email || '',
        telefono: response.data.phone || '',
        departamento: 'Departamento de Ciberseguridad',
        cargo: 'Jefe de Departamento',
        oficina: response.data.office || '',
        extension: response.data.extension || ''
      });
      
      // Cargar usuarios activos
      const usuariosResponse = await api.get('/auth/users/?role=estudiante');
      const usuariosActivos = Array.isArray(usuariosResponse.data) 
        ? usuariosResponse.data.length 
        : usuariosResponse.data.results?.length || 0;
      
      // Cargar SOLO las solicitudes revisadas por ESTE jefe específico
      console.log(`🔍 Buscando solicitudes con reviewed_by=${response.data.id}`);
      const solicitudesRevisadas = await api.get(`/requests/?reviewed_by=${response.data.id}`);
      const solicitudesArray = Array.isArray(solicitudesRevisadas.data) 
        ? solicitudesRevisadas.data 
        : solicitudesRevisadas.data.results || [];
      
      console.log('📊 Solicitudes revisadas por este jefe:', solicitudesArray);
      console.log('📊 Cantidad total:', solicitudesArray.length);
      
      // Mostrar detalles de cada solicitud
      solicitudesArray.forEach((sol, index) => {
        console.log(`   Solicitud ${index + 1}:`, {
          id: sol.id,
          estudiante: sol.estudiante_nombre,
          status: sol.status,
          reviewed_by_id: sol.reviewed_by,
          reviewed_by_name: sol.reviewed_by_name
        });
      });
      
      // Contar por estado (usando estados en español)
      const aprobadas = solicitudesArray.filter(s => s.status === 'aprobada').length;
      const rechazadas = solicitudesArray.filter(s => s.status === 'rechazada').length;
      const pendientes = solicitudesArray.filter(s => s.status === 'pendiente').length;
      
      console.log('Conteo de solicitudes:', { aprobadas, rechazadas, pendientes }); // Debug
      
      // Calcular tiempo promedio de revisión solo para las que ESTE jefe ha revisado
      let tiempoPromedio = '0 horas';
      const solicitudesConReview = solicitudesArray.filter(s => s.created_at && s.review_date);
      
      if (solicitudesConReview.length > 0) {
        const tiempos = solicitudesConReview.map(s => {
            const inicio = new Date(s.created_at);
            const fin = new Date(s.review_date);
            return (fin - inicio) / (1000 * 60 * 60 * 24); // días
          });
        
        const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
        tiempoPromedio = promedio < 1 
          ? `${Math.round(promedio * 24)} horas` 
          : `${Math.round(promedio)} días`;
      }
      
      setStats({
        aprobadas: aprobadas,
        rechazadas: rechazadas,
        pendientes: pendientes,
        estudiantes_activos: usuariosActivos,
        tiempo_promedio: tiempoPromedio
      });
      
      // Cargar actividad reciente (últimas 5 solicitudes del sistema)
      try {
        const actividadResponse = await api.get('/requests/?ordering=-created_at');
        const actividadArray = Array.isArray(actividadResponse.data) 
          ? actividadResponse.data 
          : actividadResponse.data.results || [];
        setActividades(actividadArray.slice(0, 5));
      } catch (actErr) {
        console.error('Error al cargar actividad:', actErr);
        setActividades([]);
      }
      
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      console.error('Detalles del error:', err.response?.data);
      setError('No se pudo cargar la información del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Obtener ID del usuario actual
      const meResponse = await api.get('/auth/users/me/');
      const userId = meResponse.data.id;
      
      // Actualizar datos del usuario
      await api.patch(`/auth/users/${userId}/`, {
        email: userData.email,
        phone: userData.telefono,
        office: userData.oficina,
        extension: userData.extension
      });
      
      setIsEditing(false);
      alert('✅ Perfil actualizado correctamente');
      cargarPerfil();
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      console.error('Detalles:', err.response?.data);
      alert('❌ Error al actualizar el perfil');
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const verDetallesSolicitud = async (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setModalDetalles(true);
  };

  const cerrarModal = () => {
    setSolicitudSeleccionada(null);
    setModalDetalles(false);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = Math.floor((ahora - date) / 1000); // segundos
    
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    if (diff < 172800) return 'Ayer';
    return date.toLocaleDateString('es-MX');
  };

  const obtenerIconoActividad = (actividad) => {
    if (actividad.status === 'aprobada' || actividad.status === 'approved') return '✅';
    if (actividad.status === 'rechazada' || actividad.status === 'rejected') return '❌';
    if (actividad.status === 'pendiente' || actividad.status === 'pending_review') return '⏳';
    return '📝';
  };

  const obtenerTextoActividad = (actividad) => {
    const revisor = actividad.reviewed_by_name || 'Un jefe';
    if (actividad.status === 'aprobada' || actividad.status === 'approved') {
      return `Solicitud aprobada por ${revisor}`;
    }
    if (actividad.status === 'rechazada' || actividad.status === 'rejected') {
      return `Solicitud rechazada por ${revisor}`;
    }
    if (actividad.status === 'pendiente' || actividad.status === 'pending_review') {
      return 'Nueva solicitud pendiente de revisión';
    }
    return 'Solicitud en proceso';
  };

  if (loading) {
    return (
      <div className="perfil-jefe-page">
        <header className="page-header">
          <h1>⏳ Cargando perfil...</h1>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-jefe-page">
        <header className="page-header">
          <h1>⚠️ Mi Perfil</h1>
          <p>{error}</p>
        </header>
        <section className="card">
          <button onClick={cargarPerfil} className="btn-primario">
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="perfil-jefe-page">
      <header className="page-header">
        <h1>👤 Mi Perfil</h1>
        <p>Gestiona tu información personal y preferencias</p>
      </header>

      <div className="perfil-grid">
        {/* Información Personal */}
        <section className="card perfil-card">
          <div className="perfil-header">
            <div className="perfil-avatar">
              <div className="avatar-img-jefe">👨‍💼</div>
              <div className="perfil-info">
                <h2>{userData.nombre}</h2>
                <p className="perfil-cargo">{userData.cargo}</p>
                <p className="perfil-departamento">{userData.departamento}</p>
              </div>
            </div>
            <div className="perfil-actions">
              <button 
                className="btn-edit"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? '❌ Cancelar' : '✏️ Editar Perfil'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="perfil-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo</label>
                <input
                  type="text"
                  id="nombre"
                  value={userData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  disabled={!isEditing}
                  className="inputr"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  value={userData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  className="inputr"
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  value={userData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  disabled={!isEditing}
                  className="inputr"
                />
              </div>
            </div>

            {isEditing && (
              <div className="form-actions">
                <button type="submit" className="btn-save">
                  💾 Guardar Cambios
                </button>
              </div>
            )}
          </form>
        </section>

        <div className="perfil-right-column">
          {/* Estadísticas del Jefe */}
          <section className="card stats-card">
            <h3>📊 Mis Estadísticas de Gestión</h3>
            
            {stats ? (
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <span className="stat-number">{stats.aprobadas + stats.rechazadas || 0}</span>
                    <span className="stat-label">Solicitudes Revisadas</span>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon">📄</div>
                  <div className="stat-content">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Publicaciones Clasificadas</span>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon">🎓</div>
                  <div className="stat-content">
                    <span className="stat-number">{stats.estudiantes_activos || 0}</span>
                    <span className="stat-label">Estudiantes Activos</span>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-content">
                    <span className="stat-number">{stats.tiempo_promedio || '0 días'}</span>
                    <span className="stat-label">Tiempo Promedio de Revisión</span>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>Cargando estadísticas...</p>
            )}
          </section>

          {/* Actividad Reciente */}
          <section className="card actividad-card">
            <h3>🕒 Actividad Reciente</h3>
            <div className="actividad-list">
              {actividades.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>
                  No hay actividad reciente
                </p>
              ) : (
                actividades.map((actividad, index) => (
                  <div 
                    key={index} 
                    className="actividad-item clickable"
                    onClick={() => verDetallesSolicitud(actividad)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`actividad-icon ${actividad.status || ''}`}>
                      {obtenerIconoActividad(actividad)}
                    </div>
                    <div className="actividad-content">
                      <p><strong>{obtenerTextoActividad(actividad)}</strong></p>
                      <span>Estudiante: {actividad.student_name || 'Sin nombre'} - {formatearFecha(actividad.review_date || actividad.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modal de Detalles de Solicitud */}
      {modalDetalles && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content-detalles" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Detalles de la Solicitud</h2>
              <button className="btn-close" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detalle-grid">
                <div className="detalle-item">
                  <label>Estudiante:</label>
                  <span>{solicitudSeleccionada.student_name || 'Sin nombre'}</span>
                </div>

                <div className="detalle-item">
                  <label>Matrícula:</label>
                  <span>{solicitudSeleccionada.student_matricula || 'N/A'}</span>
                </div>

                <div className="detalle-item">
                  <label>Estado:</label>
                  <span 
                    className="badge-estado"
                    style={{ 
                      backgroundColor: solicitudSeleccionada.status === 'aprobada' ? '#10b981' : 
                                       solicitudSeleccionada.status === 'rechazada' ? '#ef4444' : '#f59e0b',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {solicitudSeleccionada.status === 'aprobada' ? '✅ Aprobada' :
                     solicitudSeleccionada.status === 'rechazada' ? '❌ Rechazada' :
                     solicitudSeleccionada.status === 'pendiente' ? '⏳ Pendiente' : '🔄 En Proceso'}
                  </span>
                </div>

                <div className="detalle-item">
                  <label>Fecha de Solicitud:</label>
                  <span>{new Date(solicitudSeleccionada.created_at).toLocaleDateString('es-MX')}</span>
                </div>

                {solicitudSeleccionada.review_date && (
                  <div className="detalle-item">
                    <label>Fecha de Revisión:</label>
                    <span>{new Date(solicitudSeleccionada.review_date).toLocaleDateString('es-MX')}</span>
                  </div>
                )}

                <div className="detalle-item full-width">
                  <label>Descripción:</label>
                  <p style={{ marginTop: '0.5rem' }}>{solicitudSeleccionada.description || 'Sin descripción'}</p>
                </div>

                {solicitudSeleccionada.review_comments && (
                  <div className="detalle-item full-width">
                    <label>Comentarios de Revisión:</label>
                    <p style={{ marginTop: '0.5rem', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '8px' }}>
                      {solicitudSeleccionada.review_comments}
                    </p>
                  </div>
                )}

                {solicitudSeleccionada.file_url && (
                  <div className="detalle-item full-width">
                    <label>Archivo:</label>
                    <a 
                      href={solicitudSeleccionada.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-download"
                      style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '6px',
                        textDecoration: 'none'
                      }}
                    >
                      📥 Descargar Archivo
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={cerrarModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerfilJefe;
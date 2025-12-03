// Perfil.jsx - COMPLETO CON TODAS LAS FUNCIONALIDADES
import './Perfil.css';
import React, { useState, useEffect } from 'react';
import Footer from '../../../components/footer';
import { authService } from '../../../services/authService';
import api from '../../../services/api';
import { validateProfile } from '../../../utils/validation';
import ChangePasswordModal from '../../../components/ChangePasswordModal/ChangePasswordModal';

function Perfil() {
  const [userData, setUserData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    matricula: '',
    phone_number: '',
    año_academico: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [statsData, setStatsData] = useState({
    publicacionesEnviadas: 0,
    solicitudesEnviadas: 0,
    solicitudesPendientes: 0,
    solicitudesAprobadas: 0,
    solicitudesRechazadas: 0
  });

  // CARGAR DATOS REALES DEL API
  useEffect(() => {
    cargarDatosReales();
  }, []);

  const cargarDatosReales = async () => {
    try {
      setLoading(true);
      
      // Cargar perfil del usuario
      const profile = await authService.getProfile();
      setUserData({
        username: profile.username,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        matricula: profile.matricula || '',
        phone_number: profile.phone_number || '',
        año_academico: profile.año_academico || '3er Año'
      });

      // Cargar estadísticas
      const stats = await api.get('/auth/profile/stats/');
      setStatsData({
        publicacionesEnviadas: stats.data.publicaciones_enviadas || 0,
        solicitudesEnviadas: stats.data.solicitudes_enviadas || 0,
        solicitudesPendientes: stats.data.solicitudes_pendientes || 0,
        solicitudesAprobadas: stats.data.solicitudes_aprobadas || 0,
        solicitudesRechazadas: stats.data.solicitudes_rechazadas || 0
      });

    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      // validar campos
      const validationErrors = validateProfile({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setLoading(true);

      // Actualizar perfil en el backend (mapear phone_number -> telefono)
      await authService.updateProfile({
        telefono: userData.phone_number,
        año_academico: userData.año_academico,
        first_name: userData.first_name,
        last_name: userData.last_name
      });

      setIsEditing(false);
      setErrors({});
      // Recargar datos
      await cargarDatosReales();

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('❌ Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Función para forzar actualización de datos
  const actualizarEstadisticas = async () => {
    await cargarDatosReales();
    alert('✅ Estadísticas actualizadas');
  };

  // Calcular porcentajes para el gráfico de pastel
  const total = statsData.publicacionesEnviadas + statsData.solicitudesEnviadas + statsData.solicitudesRechazadas;
  const porcentajes = total > 0 ? {
    publicaciones: (statsData.publicacionesEnviadas / total) * 100,
    solicitudes: (statsData.solicitudesEnviadas / total) * 100,
    rechazos: (statsData.solicitudesRechazadas / total) * 100
  } : { publicaciones: 0, solicitudes: 0, rechazos: 0 };

  if (loading && !userData.username) {
    return (
      <div className="dash-page">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <header className="panel-header">
        <img src="Imagenes/logouci.webp" alt="Logo UCI" className="profile-photo"/>
        <h1>Mi Perfil</h1>
      </header>

      <div className="profile-grid">
        {/* Información Personal */}
        <section className="card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <img src="Imagenes/Avatar.jpg" alt="Avatar" className="avatar-img"/>
              <div>
                <h2>{userData.first_name && userData.last_name 
                      ? `${userData.first_name} ${userData.last_name}` 
                      : userData.username}</h2>
                <p className="profile-role">Estudiante</p>
                {userData.matricula && <p className="profile-matricula">Matrícula: {userData.matricula}</p>}
              </div>
            </div>
            <div className="profile-actions">
              <button 
                className="btn-edit"
                onClick={() => setIsEditing(!isEditing)}
                disabled={loading}
              >
                {isEditing ? 'Cancelar' : 'Editar Perfil'}
              </button>
              <button 
                className="btn-change-password"
                onClick={() => setIsPasswordModalOpen(true)}
                title="Cambiar contraseña"
                disabled={loading}
              >
                🔒 Cambiar Contraseña
              </button>
              <button 
                className="btn-refresh-stats"
                onClick={actualizarEstadisticas}
                title="Actualizar estadísticas"
                disabled={loading}
              >
                🔄 Actualizar
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="profile-form">
            <div className="form-grid-simple">
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={userData.first_name}
                  onChange={(e) => setUserData({...userData, first_name: e.target.value})}
                  disabled={!isEditing}
                  className="inputr"
                  placeholder="Nombre"
                />
                {errors.first_name && <div className="field-error">{errors.first_name}</div>}
              </div>

              <div className="form-group">
                <label>Apellidos</label>
                <input
                  type="text"
                  value={userData.last_name}
                  onChange={(e) => setUserData({...userData, last_name: e.target.value})}
                  disabled={!isEditing}
                  className="inputr"
                  placeholder="Apellidos"
                />
                {errors.last_name && <div className="field-error">{errors.last_name}</div>}
              </div>

              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  value={userData.username}
                  disabled={true}
                  className="inputr"
                  title="El nombre de usuario no se puede cambiar"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={userData.email}
                  disabled={true}
                  className="inputr"
                  title="El email no se puede cambiar"
                />
              </div>

              <div className="form-group">
                <label>Año Académico</label>
                <select
                  value={userData.año_academico}
                  onChange={(e) => setUserData({...userData, año_academico: e.target.value})}
                  disabled={!isEditing}
                  className="inputr"
                >
                  <option value="">Seleccionar...</option>
                  <option value="1er Año">1er Año</option>
                  <option value="2do Año">2do Año</option>
                  <option value="3er Año">3er Año</option>
                  <option value="4to Año">4to Año</option>
                  <option value="5to Año">5to Año</option>
                </select>
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={userData.phone_number}
                  onChange={(e) => setUserData({...userData, phone_number: e.target.value})}
                  disabled={!isEditing}
                  className="inputr"
                  placeholder="+53 12345678"
                />
                {errors.phone_number && <div className="field-error">{errors.phone_number}</div>}
              </div>
            </div>

            {isEditing && (
              <button type="submit" className="btn-upload" disabled={loading}>
                {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
              </button>
            )}
          </form>
        </section>

        {/* Gráfico de Pastel con las 3 estadísticas */}
        <section className="card stats-card">
          <div className="stats-header">
            <h3>📊 Mis Estadísticas</h3>
            <div className="stats-actions">
              <span className="last-update">Actualizado: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="pie-chart-container">
            {total === 0 ? (
              <div className="no-data-stats">
                <p>📝 Aún no tienes actividades registradas</p>
                <p className="hint">Envía una solicitud o publica tu primer trabajo</p>
                <button 
                  className="btn-quick-nav"
                  onClick={() => window.location.href = '/solicitud'}
                >
                  📝 Ir a Solicitud
                </button>
                <button 
                  className="btn-quick-nav"
                  onClick={() => window.location.href = '/publicaciones'}
                >
                  📄 Ir a Publicaciones
                </button>
              </div>
            ) : (
              <>
                <div className="pie-chart">
                  {/* Segmento de Publicaciones Enviadas */}
                  <div 
                    className="pie-segment publications"
                    style={{ 
                      '--percentage': porcentajes.publicaciones,
                      '--color': '#3b82f6'
                    }}
                  ></div>
                  
                  {/* Segmento de Solicitudes Enviadas */}
                  <div 
                    className="pie-segment requests"
                    style={{ 
                      '--percentage': porcentajes.solicitudes,
                      '--color': '#10b981',
                      '--offset': porcentajes.publicaciones
                    }}
                  ></div>
                  
                  {/* Segmento de Rechazos */}
                  <div 
                    className="pie-segment rejected"
                    style={{ 
                      '--percentage': porcentajes.rechazos,
                      '--color': '#ef4444',
                      '--offset': porcentajes.publicaciones + porcentajes.solicitudes
                    }}
                  ></div>
                  
                  <div className="pie-center">
                    <span className="pie-total">{total}</span>
                    <span className="pie-label">Total</span>
                  </div>
                </div>
                
                <div className="pie-legend">
                  <div className="legend-item">
                    <span className="legend-color publications"></span>
                    <span>
                      Publicaciones Enviadas 
                      <strong> ({statsData.publicacionesEnviadas})</strong>
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color requests"></span>
                    <span>
                      Solicitudes Enviadas 
                      <strong> ({statsData.solicitudesEnviadas})</strong>
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color rejected"></span>
                    <span>
                      Solicitudes Rechazadas 
                      <strong> ({statsData.solicitudesRechazadas})</strong>
                    </span>
                  </div>
                </div>

                {/* Resumen numérico */}
                <div className="stats-summary">
                  <div className="summary-item">
                    <span className="summary-number">{statsData.publicacionesEnviadas}</span>
                    <span className="summary-label">Publicación{statsData.publicacionesEnviadas !== 1 ? 'es' : ''}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-number">{statsData.solicitudesEnviadas}</span>
                    <span className="summary-label">Solicitud{statsData.solicitudesEnviadas !== 1 ? 'es' : ''}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-number">{statsData.solicitudesRechazadas}</span>
                    <span className="summary-label">Rechazada{statsData.solicitudesRechazadas !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Detalle adicional */}
                {statsData.solicitudesRechazadas > 0 && (
                  <div className="rechazos-detalle">
                    <h4>📋 Estado de Solicitudes</h4>
                    <div className="stats-detail">
                      <div className="detail-item">
                        <span className="detail-icon">✅</span>
                        <span className="detail-label">Aprobadas:</span>
                        <span className="detail-value">{statsData.solicitudesAprobadas}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⏳</span>
                        <span className="detail-label">Pendientes:</span>
                        <span className="detail-value">{statsData.solicitudesPendientes}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">❌</span>
                        <span className="detail-label">Rechazadas:</span>
                        <span className="detail-value">{statsData.solicitudesRechazadas}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
      
      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
      
      <Footer/>
    </div>
  );
}

export default Perfil;
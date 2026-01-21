// Perfil.jsx - COMPLETO CON TODAS LAS FUNCIONALIDADES
import './Perfil.css';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Footer from '../../../components/footer';
import authService from '../../../services/authService';
import api from '../../../services/api';
import { validateProfile } from '../../../utils/validation';
import ChangePasswordModal from '../../../components/ChangePasswordModal/ChangePasswordModal';

function Perfil() {
  const [userData, setUserData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
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
    solicitudesAprobadas: 0
  });

  // CARGAR DATOS REALES DEL API
  useEffect(() => {
    cargarDatosReales();

    // Listener para actualizar cuando se envía una solicitud
    const handleSolicitudUpdate = () => {
      console.log('🔔 Notificación: Solicitud actualizada, recargando estadísticas');
      cargarDatosReales();
    };

    window.addEventListener('solicitud_updated', handleSolicitudUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'solicitud_updated') {
        handleSolicitudUpdate();
      }
    });

    return () => {
      window.removeEventListener('solicitud_updated', handleSolicitudUpdate);
    };
  }, []);

  const cargarDatosReales = async () => {
    try {
      setLoading(true);
      console.log('📊 Iniciando carga de datos del perfil...');
      
      // Cargar perfil del usuario
      const profile = await authService.getProfile();
      // Normalizar teléfono: extraer solo los 8 dígitos (sin prefijo)
      const serverPhone = profile.phone_number || profile.telefono || profile.phone || '';
      let digits = String(serverPhone || '').replace(/[^0-9]/g, '');
      if (digits.startsWith('53') && digits.length > 8) {
        digits = digits.slice(digits.length - 8);
      } else if (digits.length > 8) {
        digits = digits.slice(digits.length - 8);
      }

      setUserData({
        username: profile.username,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone_number: digits || '',
        año_academico: profile.año_academico || '3er Año'
      });

      // Cargar estadísticas
      const stats = await api.get('/auth/profile/stats/', { 
        params: { t: Date.now() }
      });
      console.log('📈 Estadísticas obtenidas del API:', stats.data);
      
      setStatsData({
        publicacionesEnviadas: stats.data.publicaciones_enviadas || 0,
        solicitudesEnviadas: stats.data.solicitudes_enviadas || 0,
        solicitudesPendientes: stats.data.solicitudes_pendientes || 0,
        solicitudesAprobadas: stats.data.solicitudes_aprobadas || 0
      });
      
      console.log('✅ Datos del perfil actualizados correctamente');

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      // validar campos
      const validationErrors = validateProfile({
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number
      });

      if (Object.keys(validationErrors).length > 0) {
        // Mostrar sólo la notificación (toast) tras intentar guardar
        if (validationErrors.phone_number) toast.warning(validationErrors.phone_number);
        setErrors(validationErrors);
        return;
      }

      setLoading(true);

      // Actualizar perfil en el backend (mapear phone_number -> telefono)
      // Asegurar que enviamos el prefijo +53 seguido de los 8 dígitos
      const phoneToSend = userData.phone_number
        ? (String(userData.phone_number).replace(/[^0-9]/g, '').slice(-8))
        : '';
      const telefonoPayload = phoneToSend ? `+53 ${phoneToSend}` : '';

      const updated = await authService.updateProfile({
        email: userData.email,
        telefono: telefonoPayload,
        año_academico: userData.año_academico,
        first_name: userData.first_name,
        last_name: userData.last_name
      });

      // Debug: mostrar respuesta del servidor tras actualizar
      console.log('Perfil actualizado - respuesta updateProfile:', updated);

      setIsEditing(false);
      setErrors({});
      toast.success('✅ Perfil actualizado correctamente');
      
      // Recargar datos y loguear lo recibido
      const profileAfter = await authService.getProfile();
      console.log('Perfil recargado después de update:', profileAfter);
      await cargarDatosReales();

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('❌ Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    let value = String(e.target.value || '');
    // Extraer solo dígitos y limitar a 8, sin mostrar notificaciones aquí
    const digits = value.replace(/[^0-9]/g, '').slice(0, 8);
    setUserData(prev => ({ ...prev, phone_number: digits }));
  };

  // Función para forzar actualización de datos
  const actualizarEstadisticas = async () => {
    await cargarDatosReales();
    toast.success('✅ Estadísticas actualizadas');
  };

  // Calcular total de actividades
  const total = statsData.publicacionesEnviadas + statsData.solicitudesEnviadas + statsData.solicitudesAprobadas;
  const porcentajes = total > 0 ? {
    publicaciones: (statsData.publicacionesEnviadas / total) * 100,
    solicitudes: (statsData.solicitudesEnviadas / total) * 100,
    aprobadas: (statsData.solicitudesAprobadas / total) * 100
  } : { publicaciones: 0, solicitudes: 0, aprobadas: 0 };

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
                  {/* matrícula removed - field not used */}
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
                  maxLength={50}
                  pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+"
                  title="Solo letras, espacios, guiones o apóstrofes"
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
                  maxLength={50}
                  pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+"
                  title="Solo letras, espacios, guiones o apóstrofes"
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
                  title="El nombre de usuario no se puede cambiar. Es tu identificador único de login."
                  maxLength={30}
                />
                <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                  No se puede cambiar. Es tu identificador único de login.
                </small>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({...userData, email: e.target.value})}
                  disabled={!isEditing}
                  className="inputr"
                  placeholder="usuario@uci.cu"
                  maxLength={100}
                />
                {errors.email && <div className="field-error">{errors.email}</div>}
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
                </select>
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px', padding: '8px 10px', background: '#f3f4f6', borderRadius: '4px' }}>+53</span>
                  <input
                    type="tel"
                    value={userData.phone_number || ''}
                    onChange={(e) => handlePhoneChange(e)}
                    disabled={!isEditing}
                    className="inputr"
                    placeholder="12345678"
                    maxLength={8}
                    style={{ flex: 1 }}
                  />
                </div>
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

        {/* Estadísticas Rediseñadas - Compactas y Profesionales */}
        <section className="card stats-card" style={{ gridColumn: '1 / -1' }}>
          <div className="stats-header">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: 'var(--color-text)', fontWeight: '600' }}>📊 Mi Actividad</h3>
          </div>
          
          {total === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--color-text-light)' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>📝 Aún no tienes actividades registradas</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn-quick-nav"
                  onClick={() => window.location.href = '/solicitud'}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  📝 Nueva Solicitud
                </button>
                <button 
                  className="btn-quick-nav"
                  onClick={() => window.location.href = '/publicaciones'}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  📄 Nueva Publicación
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {/* Tarjeta Principal - Total */}
              <div style={{
                background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)`,
                borderRadius: 'var(--border-radius)',
                padding: '1rem',
                color: 'white',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
                transition: 'transform 0.2s ease'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>{total}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Actividades</div>
              </div>

              {/* Publicaciones */}
              <div style={{
                background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)`,
                borderRadius: 'var(--border-radius)',
                padding: '1rem',
                color: 'white',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
                transition: 'transform 0.2s ease'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                  {statsData.publicacionesEnviadas}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Publicacione{statsData.publicacionesEnviadas !== 1 ? 's' : ''}</div>
              </div>

              {/* Solicitudes */}
              <div style={{
                background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)`,
                borderRadius: 'var(--border-radius)',
                padding: '1rem',
                color: 'white',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
                transition: 'transform 0.2s ease'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                  {statsData.solicitudesEnviadas}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Solicitudes{statsData.solicitudesEnviadas !== 1 ? 's' : ''}</div>
              </div>

              {/* Estado Solicitudes - Fila Inferior */}
              <div style={{
                background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)`,
                borderRadius: 'var(--border-radius)',
                padding: '1rem',
                color: 'white',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
                transition: 'transform 0.2s ease'
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                  {statsData.solicitudesAprobadas}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>✅ Aprobadas</div>
              </div>

               {/* Mostrar solo los estados relevantes: Enviada y Aprobada */}
            </div>
          )}
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
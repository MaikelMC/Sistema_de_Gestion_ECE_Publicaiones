// src/pages/Tutor/PerfilTutor/PerfilTutor.jsx
import './PerfilTutor.css';
import React, { useState, useEffect } from 'react';
import Footer from '../../../components/footer';
import authService from '../../../services/authService';
import { validateProfile } from '../../../utils/validation';
import ChangePasswordModal from '../../../components/ChangePasswordModal/ChangePasswordModal';

function PerfilTutor() {
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    departamento: '',
    especialidad: '',
    
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const profile = await authService.getProfile();
      // Mapear datos del backend al estado local
      const nombre = profile.first_name || profile.username || '';
      const apellido = profile.last_name || '';
      setUserData({
        nombre: `${nombre} ${apellido}`.trim(),
        email: profile.email || '',
        telefono: profile.telefono || '',
        departamento: profile.carrera || profile.grado_academico || '',
        especialidad: profile.especialidad || '',
        
      });
    } catch (err) {
      console.error('Error al cargar datos del perfil:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleSave = (e) => {
    e.preventDefault();
    (async () => {
      try {
        setLoading(true);
        // Validar campos antes de enviar
        const validationErrors = validateProfile({
          nombre: userData.nombre,
          email: userData.email,
          telefono: userData.telefono,
          carrera: userData.departamento,
          especialidad: userData.especialidad
        });

        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setLoading(false);
          return;
        }
        // Preparar payload con campos que el backend soporta
        const nombreCompleto = userData.nombre || '';
        const parts = nombreCompleto.split(' ');
        const first_name = parts.shift() || '';
        const last_name = parts.join(' ') || '';

        const payload = {
          first_name,
          last_name,
          email: userData.email,
          telefono: userData.telefono,
          especialidad: userData.especialidad,
          // usamos 'carrera' para mapear departamento si aplica
          carrera: userData.departamento
        };

        const updated = await authService.updateProfile(payload);
        // Actualizar estado con respuesta del servidor
        const nombreResp = (updated.first_name || '') + ' ' + (updated.last_name || '');
        setUserData(prev => ({
          ...prev,
          nombre: nombreResp.trim(),
          email: updated.email || prev.email,
          telefono: updated.telefono || prev.telefono,
          departamento: updated.carrera || updated.grado_academico || prev.departamento,
          especialidad: updated.especialidad || prev.especialidad
        }));
        setErrors({});
        setIsEditing(false);
        //alert('✅ Perfil actualizado correctamente');
      } catch (err) {
        console.error('Error al guardar perfil:', err);
        alert('❌ Error al actualizar el perfil. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    })();
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) {
    return (
      <div className="perfil-tutor-page">
        <header className="page-header">
          <h1>⏳ Cargando perfil...</h1>
        </header>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="perfil-tutor-page">
      <header className="page-header">
        <h1> Mi Perfil</h1>
        <p>Gestiona tu información personal y académica</p>
      </header>

      <div className="perfil-content">
        {/* Información Personal */}
        <section className="card perfil-card">
          <div className="perfil-header">
            <div className="perfil-avatar">
              <div className="avatar-img-tutor">👨‍🏫</div>
              <div className="perfil-info">
                <h2>{userData.nombre}</h2>
                <p className="perfil-cargo">Tutor Académico</p>
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
              <button 
                className="btn-change-password"
                onClick={() => setIsPasswordModalOpen(true)}
                title="Cambiar contraseña"
              >
                🔒 Cambiar Contraseña
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
                {errors.nombre && <div className="field-error">{errors.nombre}</div>}
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
                {errors.email && <div className="field-error">{errors.email}</div>}
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
                {errors.telefono && <div className="field-error">{errors.telefono}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="especialidad">Especialidad</label>
                <input
                  type="text"
                  id="especialidad"
                  value={userData.especialidad}
                  onChange={(e) => handleInputChange('especialidad', e.target.value)}
                  disabled={!isEditing}
                  className="inputr"
                />
                {errors.especialidad && <div className="field-error">{errors.especialidad}</div>}
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
      </div>
      
      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
      
      <Footer />
    </div>
  );
}

export default PerfilTutor;
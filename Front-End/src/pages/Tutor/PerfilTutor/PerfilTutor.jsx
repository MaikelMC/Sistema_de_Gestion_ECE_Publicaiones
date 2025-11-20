// src/pages/Tutor/PerfilTutor/PerfilTutor.jsx
import './PerfilTutor.css';
import React, { useState } from 'react';

function PerfilTutor() {
  const [userData, setUserData] = useState({
    nombre: 'Dr. Roberto Mendoza',
    email: 'rmendoza@uci.cu',
    telefono: '+53 98765432',
    departamento: 'Departamento de Ingeniería Informática',
    especialidad: 'Inteligencia Artificial',
    añosExperiencia: '8',
    oficina: 'Edificio B, Oficina 201',
    extension: '3456'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    alert('✅ Perfil actualizado correctamente');
  };

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
              </div>

              <div className="form-group">
                <label htmlFor="añosExperiencia">Años de Experiencia</label>
                <input
                  type="number"
                  id="añosExperiencia"
                  value={userData.añosExperiencia}
                  onChange={(e) => handleInputChange('añosExperiencia', e.target.value)}
                  disabled={!isEditing}
                  className="inputr"
                  min="0"
                  max="50"
                />
              </div>

              <div className="form-group">
                <label htmlFor="oficina">Oficina</label>
                <input
                  type="text"
                  id="oficina"
                  value={userData.oficina}
                  onChange={(e) => handleInputChange('oficina', e.target.value)}
                  disabled={!isEditing}
                  className="inputr"
                />
              </div>

              <div className="form-group">
                <label htmlFor="extension">Extensión</label>
                <input
                  type="text"
                  id="extension"
                  value={userData.extension}
                  onChange={(e) => handleInputChange('extension', e.target.value)}
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
      </div>
    </div>
  );
}

export default PerfilTutor;
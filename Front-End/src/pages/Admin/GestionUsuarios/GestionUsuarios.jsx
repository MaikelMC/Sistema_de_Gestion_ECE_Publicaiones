import './GestionUsuarios.css';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, [filtro]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir URL con filtros
      let url = '/auth/users/';
      if (filtro !== 'todos') {
        url += `?role=${filtro}`;
      }
      
      const response = await api.get(url);
      console.log('Respuesta usuarios:', response.data);
      
      // Manejar tanto arrays directos como objetos con results
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || response.data.data || []);
      
      setUsuarios(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      console.error('Detalles:', err.response?.data);
      setError('Error al cargar los usuarios. Por favor, intenta de nuevo.');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const cambiarRol = async (userId, nuevoRol) => {
    try {
      await api.patch(`/auth/users/${userId}/`, {
        role: nuevoRol
      });
      
      // Actualizar localmente
      setUsuarios(usuarios.map(user => 
        user.id === userId ? { ...user, role: nuevoRol } : user
      ));
      
      alert(`✅ Rol actualizado a ${nuevoRol}`);
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      alert('❌ Error al cambiar el rol');
    }
  };

  const toggleEstado = async (userId) => {
    try {
      const usuario = usuarios.find(u => u.id === userId);
      const nuevoEstado = !usuario.activo;
      
      await api.patch(`/auth/users/${userId}/`, {
        activo: nuevoEstado
      });
      
      // Actualizar localmente
      setUsuarios(usuarios.map(user => 
        user.id === userId ? { ...user, activo: nuevoEstado } : user
      ));
      
      alert(`✅ Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert('❌ Error al cambiar el estado del usuario');
    }
  };

  const eliminarUsuario = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }
    
    try {
      await api.delete(`/auth/users/${userId}/`);
      
      // Remover localmente
      setUsuarios(usuarios.filter(user => user.id !== userId));
      
      alert('✅ Usuario eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      alert('❌ Error al eliminar el usuario');
    }
  };

  const usuariosFiltrados = usuarios;

  return (
    <div className="gestion-usuarios">
      <header className="panel-header">
        <h1>👥 Gestión de Usuarios</h1>
        <p>Administra todos los usuarios del sistema</p>
      </header>

      {/* Filtros */}
      <section className="card">
        <div className="filtros">
          <button 
            className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`} 
            onClick={() => setFiltro('todos')}
            disabled={loading}
          >
            Todos ({usuarios.length})
          </button>
          <button 
            className={`filtro-btn ${filtro === 'estudiante' ? 'active' : ''}`} 
            onClick={() => setFiltro('estudiante')}
            disabled={loading}
          >
            Estudiantes
          </button>
          <button 
            className={`filtro-btn ${filtro === 'tutor' ? 'active' : ''}`} 
            onClick={() => setFiltro('tutor')}
            disabled={loading}
          >
            Tutores
          </button>
          <button 
            className={`filtro-btn ${filtro === 'jefe' ? 'active' : ''}`} 
            onClick={() => setFiltro('jefe')}
            disabled={loading}
          >
            Jefes
          </button>
          <button 
            className={`filtro-btn ${filtro === 'admin' ? 'active' : ''}`} 
            onClick={() => setFiltro('admin')}
            disabled={loading}
          >
            Admins
          </button>
        </div>
      </section>

      {/* Mensaje de error */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={cargarUsuarios} className="btn-retry">
            Reintentar
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <section className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>⏳ Cargando usuarios...</p>
          </div>
        </section>
      )}

      {/* Tabla de usuarios */}
      {!loading && !error && (
        <section className="card">
          <div className="table-header">
            <h3>Lista de Usuarios</h3>
            <button onClick={cargarUsuarios} className="btn-refresh" title="Recargar">
              🔄
            </button>
          </div>
          <div className="table-container">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay usuarios para mostrar
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map(usuario => (
                    <tr key={usuario.id}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {((usuario.first_name || usuario.username || 'U').charAt(0)).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name">
                              {usuario.first_name && usuario.last_name 
                                ? `${usuario.first_name} ${usuario.last_name}`
                                : usuario.username || 'Sin nombre'}
                            </div>
                            {usuario.matricula && (
                              <div className="user-matricula">Mat: {usuario.matricula}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{usuario.email || 'Sin email'}</td>
                      <td>
                        <select 
                          value={usuario.role || 'estudiante'}
                          onChange={(e) => cambiarRol(usuario.id, e.target.value)}
                          className="rol-select"
                          disabled={usuario.role === 'admin'}
                        >
                          <option value="estudiante">Estudiante</option>
                          <option value="tutor">Tutor</option>
                          <option value="jefe">Jefe</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`estado-badge ${usuario.activo ? 'activo' : 'inactivo'}`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {usuario.created_at 
                          ? new Date(usuario.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })
                          : 'N/A'
                        }
                      </td>
                      <td>
                        <div className="acciones">
                          <button 
                            className="btn-editar" 
                            onClick={() => toggleEstado(usuario.id)}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                            disabled={usuario.role === 'admin'}
                          >
                            {usuario.activo ? '🔒' : '🔓'}
                          </button>
                          <button 
                            className="btn-eliminar"
                            onClick={() => eliminarUsuario(usuario.id)}
                            title="Eliminar"
                            disabled={usuario.role === 'admin'}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default GestionUsuarios;
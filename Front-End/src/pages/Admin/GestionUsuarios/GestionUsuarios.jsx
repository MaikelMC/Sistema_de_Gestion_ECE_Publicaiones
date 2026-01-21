import './GestionUsuarios.css';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import showConfirm from '../../../utils/showConfirm';

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [error, setError] = useState(null);
  
  // Estados para gestión de roles personalizados
  const [showRolModal, setShowRolModal] = useState(false);
  const [rolesPersonalizados, setRolesPersonalizados] = useState(() => {
    const saved = localStorage.getItem('roles_personalizados');
    return saved ? JSON.parse(saved) : [];
  });
  const [nuevoRol, setNuevoRol] = useState({ nombre: '', permisos: [] });
  
  // Permisos disponibles en el sistema
  const permisosDisponibles = [
    { id: 'ver_usuarios', label: 'Ver usuarios' },
    { id: 'editar_usuarios', label: 'Editar usuarios' },
    { id: 'eliminar_usuarios', label: 'Eliminar usuarios' },
    { id: 'ver_publicaciones', label: 'Ver publicaciones' },
    { id: 'aprobar_publicaciones', label: 'Aprobar publicaciones' },
    { id: 'ver_solicitudes', label: 'Ver solicitudes' },
    { id: 'aprobar_solicitudes', label: 'Aprobar solicitudes' },
    { id: 'ver_logs', label: 'Ver logs del sistema' },
    { id: 'gestionar_config', label: 'Gestionar configuración' },
  ];

  useEffect(() => {
    cargarUsuarios();
  }, [filtro]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir parámetros con filtros y anti-cache
      const params = {};
      if (filtro !== 'todos') params.role = filtro;
      params.t = Date.now();

      const response = await api.get('/auth/users/', { params });
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
      
      //alert(`✅ Rol actualizado a ${nuevoRol}`);
      // Notificar a otras vistas que los usuarios cambiaron
      try {
        localStorage.setItem('users_updated', Date.now().toString());
        window.dispatchEvent(new Event('users_updated'));
      } catch (e) {
        console.warn('No se pudo notificar actualización de usuarios:', e);
      }
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      toast.error('❌ Error al cambiar el rol');
    }
  };

  const toggleEstado = async (userId) => {
    try {
      const usuario = usuarios.find(u => u.id === userId);
      const nuevoEstado = !usuario.activo;
      
      // Confirmar antes de desactivar
      if (!nuevoEstado) {
        const confirmado = await showConfirm({ 
          message: `¿Estás seguro de que quieres desactivar a ${usuario.first_name || usuario.username}? El usuario no podrá acceder al sistema.` 
        });
        if (!confirmado) return;
      }
      
      await api.patch(`/auth/users/${userId}/`, {
        activo: nuevoEstado
      });
      
      // Actualizar localmente
      setUsuarios(usuarios.map(user => 
        user.id === userId ? { ...user, activo: nuevoEstado } : user
      ));
      
      toast.success(`✅ Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`);
      // Notificar a otras vistas que los usuarios cambiaron
      try {
        localStorage.setItem('users_updated', Date.now().toString());
        window.dispatchEvent(new Event('users_updated'));
      } catch (e) {
        console.warn('No se pudo notificar actualización de usuarios:', e);
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      toast.error('❌ Error al cambiar el estado del usuario');
    }
  };

  const eliminarUsuario = async (userId) => {
    const confirmado = await showConfirm({ message: '¿Estás seguro de que quieres eliminar este usuario?' });
    if (!confirmado) return;
    try {
      await api.delete(`/auth/users/${userId}/`);
      // Remover localmente
      setUsuarios(usuarios.filter(user => user.id !== userId));
      toast.success('✅ Usuario eliminado correctamente');
      // Notificar a otras vistas que los usuarios cambiaron
      try {
        localStorage.setItem('users_updated', Date.now().toString());
        window.dispatchEvent(new Event('users_updated'));
      } catch (e) {
        console.warn('No se pudo notificar actualización de usuarios:', e);
      }
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      toast.error('❌ Error al eliminar el usuario');
    }
  };

  const usuariosFiltrados = usuarios;

  // Guardar nuevo rol personalizado
  const guardarNuevoRol = () => {
    if (!nuevoRol.nombre.trim()) {
      toast.warning('Ingresa un nombre para el rol');
      return;
    }
    if (nuevoRol.permisos.length === 0) {
      toast.warning('Selecciona al menos un permiso');
      return;
    }
    const rolExiste = rolesPersonalizados.find(r => r.nombre.toLowerCase() === nuevoRol.nombre.toLowerCase());
    if (rolExiste) {
      toast.warning('Ya existe un rol con ese nombre');
      return;
    }
    const nuevosRoles = [...rolesPersonalizados, { ...nuevoRol, id: Date.now() }];
    setRolesPersonalizados(nuevosRoles);
    localStorage.setItem('roles_personalizados', JSON.stringify(nuevosRoles));
    setNuevoRol({ nombre: '', permisos: [] });
    toast.success(`✅ Rol "${nuevoRol.nombre}" creado correctamente`);
  };

  // Eliminar rol personalizado
  const eliminarRolPersonalizado = async (rolId) => {
    const confirmado = await showConfirm({ message: '¿Estás seguro de eliminar este rol?' });
    if (!confirmado) return;
    const nuevosRoles = rolesPersonalizados.filter(r => r.id !== rolId);
    setRolesPersonalizados(nuevosRoles);
    localStorage.setItem('roles_personalizados', JSON.stringify(nuevosRoles));
    toast.success('✅ Rol eliminado');
  };

  // Toggle permiso en nuevo rol
  const togglePermiso = (permisoId) => {
    setNuevoRol(prev => ({
      ...prev,
      permisos: prev.permisos.includes(permisoId)
        ? prev.permisos.filter(p => p !== permisoId)
        : [...prev.permisos, permisoId]
    }));
  };

  return (
    <div className="gestion-usuarios">
      <header className="panel-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>👥 Gestión de Usuarios</h1>
            <p>Administra todos los usuarios del sistema</p>
          </div>
          <button 
            className="btn-refresh" 
            onClick={() => setShowRolModal(true)}
            style={{ marginLeft: 'auto' }}
          >
            ⚙️ Gestionar Roles
          </button>
        </div>
      </header>

      {/* Modal de Gestión de Roles */}
      {showRolModal && (
        <div className="modal-overlay" onClick={() => setShowRolModal(false)}>
          <div className="modal-card card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>⚙️ Gestión de Roles</h2>
              <button className="btn-close" onClick={() => setShowRolModal(false)}>✕</button>
            </div>
            
            {/* Crear nuevo rol */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0 }}>➕ Crear Nuevo Rol</h3>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Nombre del Rol:</label>
                <input
                  type="text"
                  value={nuevoRol.nombre}
                  onChange={e => setNuevoRol({ ...nuevoRol, nombre: e.target.value })}
                  placeholder="Ej: Coordinador, Supervisor..."
                  className="inputr"
                  maxLength={30}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                />
              </div>
              
              <div className="form-group">
                <label>Permisos:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {permisosDisponibles.map(permiso => (
                    <label key={permiso.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={nuevoRol.permisos.includes(permiso.id)}
                        onChange={() => togglePermiso(permiso.id)}
                      />
                      {permiso.label}
                    </label>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={guardarNuevoRol} 
                className="btn-refresh"
                style={{ marginTop: '1rem' }}
              >
                💾 Guardar Rol
              </button>
            </div>
            
            {/* Lista de roles personalizados */}
            <div>
              <h3>📋 Roles Personalizados ({rolesPersonalizados.length})</h3>
              {rolesPersonalizados.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center' }}>No hay roles personalizados creados</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {rolesPersonalizados.map(rol => (
                    <div key={rol.id} style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{rol.nombre}</strong>
                        <button 
                          className="btn-eliminar" 
                          onClick={() => eliminarRolPersonalizado(rol.id)}
                          title="Eliminar rol"
                        >
                          🗑️
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                        Permisos: {rol.permisos.map(p => permisosDisponibles.find(pd => pd.id === p)?.label).filter(Boolean).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                            {/* matrícula removed - field not used */}
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
                          <optgroup label="Roles del Sistema">
                            <option value="estudiante">Estudiante</option>
                            <option value="tutor">Tutor</option>
                            <option value="jefe">Jefe</option>
                            <option value="admin">Admin</option>
                          </optgroup>
                          {rolesPersonalizados.length > 0 && (
                            <optgroup label="Roles Personalizados">
                              {rolesPersonalizados.map(rol => (
                                <option key={rol.id} value={rol.nombre.toLowerCase()}>{rol.nombre}</option>
                              ))}
                            </optgroup>
                          )}
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
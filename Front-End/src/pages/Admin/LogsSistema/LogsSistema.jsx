import './LogsSistema.css';
import { useState, useEffect } from 'react';
import api from '../../../services/api';

function LogsSistema() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarLogs();
  }, []);

  const cargarLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/system-logs/');
      console.log('Respuesta logs:', response.data);
      
      // Manejar tanto arrays directos como objetos con results
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || response.data.data || []);
      
      setLogs(data);
    } catch (err) {
      console.error('Error al cargar logs:', err);
      console.error('Detalles:', err.response?.data);
      setError('No se pudieron cargar los logs del sistema');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      return date.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const logsFiltrados = logs.filter(log => {
    // Filtro por acción
    if (filtro !== 'todos' && log.action !== filtro) {
      return false;
    }
    // Búsqueda en descripción y usuario
    if (busqueda) {
      const textoLower = busqueda.toLowerCase();
      return (
        log.description?.toLowerCase().includes(textoLower) ||
        log.user_name?.toLowerCase().includes(textoLower) ||
        log.user?.username?.toLowerCase().includes(textoLower)
      );
    }
    return true;
  });

  if (error) {
    return (
      <div className="logs-sistema">
        <header className="panel-header">
          <h1>⚠️ Logs del Sistema</h1>
          <p>{error}</p>
        </header>
        <section className="card">
          <button onClick={cargarLogs} className="btn-primario">
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="logs-sistema">
      <header className="panel-header">
        <h1>📋 Logs del Sistema</h1>
        <p>Registro de actividades y auditoría</p>
      </header>

      <section className="card">
        <div className="logs-filtros">
          <input 
            type="text" 
            placeholder="🔍 Buscar en logs..." 
            className="busqueda-input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select 
            className="filtro-select"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="todos">Todos los logs</option>
            <option value="login">Inicios de sesión</option>
            <option value="logout">Cierres de sesión</option>
            <option value="create">Creaciones</option>
            <option value="update">Actualizaciones</option>
            <option value="delete">Eliminaciones</option>
            <option value="review">Revisiones</option>
            <option value="approve">Aprobaciones</option>
            <option value="reject">Rechazos</option>
          </select>
        </div>
      </section>

      <section className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Cargando logs...</p>
          </div>
        ) : (
          <div className="logs-list">
            {logsFiltrados.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>
                No se encontraron logs
              </p>
            ) : (
              logsFiltrados.map(log => (
                <div key={log.id} className="log-item">
                  <div className="log-info">
                    <strong>{log.user_name || log.user?.username || 'Sistema'}</strong>
                    <span>
                      {log.action_display || log.action || 'Acción'}: {log.description || 'Sin descripción'}
                    </span>
                    {log.ip_address && <small>IP: {log.ip_address}</small>}
                  </div>
                  <div className="log-fecha">{formatearFecha(log.created_at || log.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default LogsSistema;
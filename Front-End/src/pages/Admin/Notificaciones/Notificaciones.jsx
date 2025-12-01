import { useState, useEffect, useCallback } from 'react';
import './Notificaciones.css';
import api from '../../../services/api';

const Notificaciones = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    notification_type: '',
    severity: '',
    is_read: '',
  });

  // Tipos y severidades con etiquetas en español
  const notificationTypes = {
    failed_login: 'Login Fallido',
    simultaneous_access: 'Acceso Simultáneo',
    system_error: 'Error de Sistema',
    db_error: 'Error de Base de Datos',
    unauthorized_attempt: 'Intento No Autorizado',
    post_approval_modification: 'Modificación Post-Aprobación',
    user_locked: 'Usuario Bloqueado',
    ip_blocked: 'IP Bloqueada'
  };

  const severityLevels = {
    info: { label: 'Información', class: 'severity-info' },
    warning: { label: 'Advertencia', class: 'severity-warning' },
    error: { label: 'Error', class: 'severity-error' },
    critical: { label: 'Crítico', class: 'severity-critical' }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.notification_type) params.notification_type = filters.notification_type;
      if (filters.severity) params.severity = filters.severity;
      if (filters.is_read !== '') params.is_read = filters.is_read;

      const response = await api.get('/requests/notifications/', { params });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/requests/notifications/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      fetchNotifications();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [filters]);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/requests/notifications/${id}/mark_read/`);
      fetchNotifications();
      fetchStats();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.post(`/requests/notifications/${id}/resolve/`);
      fetchNotifications();
      fetchStats();
    } catch (error) {
      console.error('Error al resolver:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityClass = (severity) => {
    return severityLevels[severity]?.class || '';
  };

  return (
    <div className="notificaciones-container">
      <div className="notificaciones-header">
        <h1>Notificaciones del Sistema</h1>
        <button onClick={fetchNotifications} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>No leídas</h3>
            <p className="stat-number unread">{stats.unread}</p>
          </div>
          <div className="stat-card">
            <h3>Pendientes</h3>
            <p className="stat-number pending">{stats.pending}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Tipo:</label>
          <select 
            value={filters.notification_type} 
            onChange={(e) => setFilters({...filters, notification_type: e.target.value})}
          >
            <option value="">Todos</option>
            {Object.entries(notificationTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Severidad:</label>
          <select 
            value={filters.severity} 
            onChange={(e) => setFilters({...filters, severity: e.target.value})}
          >
            <option value="">Todas</option>
            {Object.entries(severityLevels).map(([key, {label}]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Estado:</label>
          <select 
            value={filters.is_read} 
            onChange={(e) => setFilters({...filters, is_read: e.target.value})}
          >
            <option value="">Todas</option>
            <option value="false">No leídas</option>
            <option value="true">Leídas</option>
          </select>
        </div>
      </div>

      {/* Lista de notificaciones */}
      {loading ? (
        <div className="loading">Cargando notificaciones...</div>
      ) : (
        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              No hay notificaciones que coincidan con los filtros seleccionados.
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`notification-card ${getSeverityClass(notif.severity)} ${!notif.is_read ? 'unread' : ''}`}
              >
                <div className="notification-header">
                  <div className="notification-type">
                    <span className="type-badge">{notificationTypes[notif.notification_type]}</span>
                    <span className={`severity-badge ${getSeverityClass(notif.severity)}`}>
                      {severityLevels[notif.severity]?.label}
                    </span>
                    {!notif.is_read && <span className="status-badge unread-badge">No leída</span>}
                    {notif.is_read && !notif.is_resolved && <span className="status-badge pending-badge">Pendiente</span>}
                    {notif.is_resolved && <span className="status-badge resolved-badge">Resuelta</span>}
                  </div>
                  <span className="notification-date">{formatDate(notif.created_at)}</span>
                </div>

                <div className="notification-body">
                  <h3>{notif.title}</h3>
                  <p>{notif.message}</p>
                  
                  {notif.user_name && (
                    <div className="notification-user">
                      <strong>Usuario:</strong> {notif.user_name}
                    </div>
                  )}
                  
                  {notif.ip_address && (
                    <div className="notification-ip">
                      <strong>IP:</strong> {notif.ip_address}
                    </div>
                  )}

                  {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                    <details className="notification-metadata">
                      <summary>Detalles adicionales</summary>
                      <pre>{JSON.stringify(notif.metadata, null, 2)}</pre>
                    </details>
                  )}
                </div>

                <div className="notification-actions">
                  {!notif.is_read && (
                    <button 
                      onClick={() => handleMarkRead(notif.id)}
                      className="btn-mark-read"
                    >
                      ✓ Marcar como leída
                    </button>
                  )}
                  {!notif.is_resolved && (
                    <button 
                      onClick={() => handleResolve(notif.id)}
                      className="btn-resolve"
                    >
                      ✓ Resolver
                    </button>
                  )}
                </div>

                {notif.read_at && (
                  <div className="notification-timestamps">
                    <small>Leída: {formatDate(notif.read_at)}</small>
                  </div>
                )}
                {notif.resolved_at && (
                  <div className="notification-timestamps">
                    <small>Resuelta: {formatDate(notif.resolved_at)}</small>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;

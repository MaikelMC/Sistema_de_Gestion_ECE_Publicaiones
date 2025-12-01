import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';
import './LogsSistema.css';

export default function LogsSistema() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ action: '', model_name: '', user: '', search: '', ordering: '-created_at', start_date: '', end_date: '' });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        action: filters.action || undefined,
        model_name: filters.model_name || undefined,
        user: filters.user || undefined,
        search: filters.search || undefined,
        ordering: filters.ordering || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      };
      const resp = await api.get('/requests/system-logs/', { params });
      const data = resp.data;
      if (data.results !== undefined) {
        setLogs(data.results);
        setTotalPages(Math.ceil((data.count || data.results.length) / pageSize));
      } else if (Array.isArray(data)) {
        setLogs(data);
        setTotalPages(1);
      } else {
        setLogs([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error(err);
      toast.error('No se pudieron cargar los logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [page, filters]);

  const handleExportCsv = () => {
    const rows = [
      ['created_at','user','action','model_name','object_id','ip_address','description']
    ].concat(
      logs.map(l => [
        l.created_at,
        l.user_name || 'Sistema',
        l.action,
        l.model_name,
        l.object_id || '',
        l.ip_address || '',
        (l.description || '').replace(/\n/g,' ')
      ])
    );
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="logs-sistema container">
      <h2>Logs del Sistema</h2>

      <div className="logs-filters">
        <input placeholder="Buscar descripción..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value, page:1})} />
        <select value={filters.action} onChange={e => setFilters({...filters, action: e.target.value, page:1})}>
          <option value="">Todas las acciones</option>
          <optgroup label="Autenticación">
            <option value="login_success">Login Exitoso</option>
            <option value="login_failed">Login Fallido</option>
            <option value="logout">Cierre de Sesión</option>
          </optgroup>
          <optgroup label="Gestión de Usuarios">
            <option value="user_create">Creación de Usuario</option>
            <option value="user_update">Actualización de Usuario</option>
            <option value="user_delete">Eliminación de Usuario</option>
            <option value="permission_change">Cambio de Permisos</option>
          </optgroup>
          <optgroup label="CRUD Recursos">
            <option value="create">Crear</option>
            <option value="update">Actualizar</option>
            <option value="delete">Eliminar</option>
          </optgroup>
          <optgroup label="Evaluaciones">
            <option value="review">Revisión</option>
            <option value="approve">Aprobación</option>
            <option value="reject">Rechazo</option>
          </optgroup>
          <optgroup label="Seguridad">
            <option value="user_lock">Bloqueo de Usuario</option>
            <option value="ip_block">Bloqueo de IP</option>
            <option value="ip_blocked_attempt">Intento desde IP Bloqueada</option>
            <option value="admin_unlock">Desbloqueo por Admin</option>
            <option value="admin_ip_deny">Acceso Admin Denegado por IP</option>
            <option value="unauthorized_attempt">Intento de Acceso No Autorizado</option>
          </optgroup>
          <optgroup label="Sistema">
            <option value="config_change">Cambio de Configuración</option>
            <option value="system_error">Error del Sistema</option>
            <option value="db_error">Error de Base de Datos</option>
          </optgroup>
        </select>
        <input type="date" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value, page:1})} />
        <input type="date" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value, page:1})} />
        <button onClick={() => { setPage(1); fetchLogs(); }}>Aplicar</button>
        <button onClick={handleExportCsv}>Exportar CSV</button>
      </div>

      <table className="logs-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Modelo</th>
            <th>Obj ID</th>
            <th>IP</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7">Cargando...</td></tr>
          ) : logs.length === 0 ? (
            <tr><td colSpan="7">No hay registros</td></tr>
          ) : logs.map(l => (
            <tr key={l.id}>
              <td>{new Date(l.created_at).toLocaleString()}</td>
              <td>{l.user_name || 'Sistema'}</td>
              <td>{l.action}</td>
              <td>{l.model_name}</td>
              <td>{l.object_id || ''}</td>
              <td>{l.ip_address || ''}</td>
              <td style={{maxWidth:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={l.description}>{l.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="logs-pagination">
        <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Anterior</button>
        <span>{page} / {totalPages}</span>
        <button disabled={page>=totalPages} onClick={() => setPage(p => p+1)}>Siguiente</button>
      </div>
    </div>
  );
}
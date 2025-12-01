import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useNotifications } from '../../hooks/useNotifications';
import './AdminLayout.css';

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await authService.logout();
    // Forzar recarga completa del navegador para limpiar todo el estado
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/admin/inicio', label: 'Dashboard', icon: '📊' },
    { path: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
    { path: '/admin/notificaciones', label: 'Notificaciones', icon: '🔔' },
    { path: '/admin/logs', label: 'Logs', icon: '📝' },
    { path: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
  ];

  return (
    <div className="admin-dash-container">
      <nav className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <img src="/Imagenes/logouci.webp" alt="Logo UCI" />
            <span>Admin System</span>
          </div>
        </div>
        
        <ul>
          {menuItems.map((item) => (
            <li 
              key={item.path} 
              className={location.pathname === item.path ? 'active' : ''}
            >
              <a onClick={() => handleNavigation(item.path)} style={{cursor: 'pointer'}}>
                <span>{item.icon}</span>
                {item.label}
                {item.path === '/admin/notificaciones' && unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </a>
            </li>
          ))}
          <li>
            <a onClick={handleLogout} style={{cursor: 'pointer'}}>
              <span>🚪</span>
              Cerrar Sesión
            </a>
          </li>
        </ul>
      </nav>

      <main className="admin-main-panel">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
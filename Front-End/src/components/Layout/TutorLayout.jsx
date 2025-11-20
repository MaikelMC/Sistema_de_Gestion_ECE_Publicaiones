// src/components/Layout/TutorLayout.jsx - CORREGIDO
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './TutorLayout.css';

function TutorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'Tutor Académico';

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await authService.logout();
    // Forzar recarga completa del navegador para limpiar todo el estado
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/tutor/inicio', label: 'Inicio', icon: '🏠' },
    { path: '/tutor/mis-alumnos', label: 'Mis Alumnos', icon: '🎓' },
    { path: '/tutor/opiniones', label: 'Opiniones de Tutor', icon: '📝' },
    { path: '/tutor/perfil', label: 'Mi Perfil', icon: '👤' },
  ];

  return (
    <div className="tutor-dash-container">
      <nav className="tutor-sidebar">
        <div className="tutor-sidebar-header">
          <div className="tutor-sidebar-brand">
            <img src="/Imagenes/logouci.webp" alt="Logo UCI" />
            <span>ECE System</span>
          </div>
         
        </div>
        
        <ul className="tutor-menu">
          {menuItems.map((item) => (
            <li 
              key={item.path} 
              className={location.pathname === item.path ? 'active' : ''}
            >
              <a onClick={() => handleNavigation(item.path)} style={{cursor: 'pointer'}}>
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </a>
            </li>
          ))}
          
          {/* CERRAR SESIÓN INTEGRADO COMO EN JEFELAYOUT */}
          <li className="logout-item">
            <a onClick={handleLogout} style={{cursor: 'pointer'}}>
              <span className="menu-icon">🚪</span>
              <span className="menu-label">Cerrar Sesión</span>
            </a>
          </li>
        </ul>
      </nav>

      <main className="tutor-main-panel">
        <Outlet />
      </main>
    </div>
  );
}

export default TutorLayout;
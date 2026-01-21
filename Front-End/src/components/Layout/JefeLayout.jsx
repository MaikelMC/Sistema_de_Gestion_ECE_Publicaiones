import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './JefeLayout.css';
import React from 'react';

function JefeLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await authService.logout();
    // Forzar recarga completa del navegador para limpiar todo el estado
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/jefe/inicio', label: 'Inicio', icon: '🏠' },
    { path: '/jefe/gestion-solicitudes', label: 'Solicitudes', icon: '📝' },
    { path: '/jefe/gestion-publicaciones', label: 'Publicaciones', icon: '📄' },
    { path: '/jefe/opiniones', label: 'Opiniones', icon: '💬' },
    { path: '/jefe/perfil', label: 'Perfil', icon: '👤' },
  ];

  return (
    <div className="dash-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/Imagenes/logouci.webp" alt="Logo UCI" />
            <span>ECE System - Jefe</span>
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

      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}

export default JefeLayout;
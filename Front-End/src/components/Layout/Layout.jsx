// src/components/Layout/Layout.jsx - ACTUALIZADO
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Layout.css';
import React from 'react';

function Layout() {
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

  // ACTUALIZADO: Cambiado "Mi Solicitud" por "Solicitud"
  const menuItems = [
    { path: '/inicio', label: 'Inicio', icon: '🏠' },
    { path: '/publicaciones', label: 'Publicaciones', icon: '📄' },
    { path: '/solicitud', label: 'Solicitud', icon: '📝' },  // CAMBIADO
    { path: '/perfil', label: 'Perfil', icon: '👤' },
  ];

  return (
    <div className="dash-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/Imagenes/logouci.webp" alt="Logo UCI" />
            <span>ECE System</span>
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

export default Layout;
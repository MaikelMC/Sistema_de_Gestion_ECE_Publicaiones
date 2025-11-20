// Inicio.jsx - MEJORADO CON INFO DE USUARIO
import './Inicio.css';
import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import Footer from '../../../components/footer';

function Inicio() {
  const { getUserDisplayName, user } = useAuth();

  const requisitos = [
    'Documento de identificación vigente',
    'Certificado de notas actualizado',
    'Carta de motivación',
    'Aprobación del tutor académico',
    'Formulario de solicitud completo'
  ];

  return (
    <div className="dash-page">
      <header className="panel-header">
        <img src="Imagenes/logouci.webp" alt="Logo UCI" className="profile-photo" />
        <div>
          <h1>Bienvenido, {getUserDisplayName()}!</h1>
          <p className="welcome-subtitle">Sistema de Gestión de Publicaciones ECE</p>
          {user?.matricula && (
            <p className="user-matricula">Matrícula: {user.matricula}</p>
          )}
        </div>
      </header>

      <section className="card welcome-card">
        <h2>¡Bienvenido de vuelta!</h2>
        <p>Este sistema te permite gestionar tus solicitudes y publicaciones ECE de manera eficiente.</p>
        <div className="welcome-actions">
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/solicitud'}
          >
            Nueva Solicitud
          </button>
          <button 
            className="btn-secondary"
            onClick={() => window.location.href = '/publicaciones'}
          >
            Ver Publicaciones
          </button>
        </div>
      </section>

      <section className="card">
        <h2>📋 Requisitos para Solicitud ECE</h2>
        <ul className="requisitos-list">
          {requisitos.map((req, index) => (
            <li key={index} className="requisito-item">
              <span className="check-icon">✅</span>
              {req}
            </li>
          ))}
        </ul>
      </section>
      
      <section className="card">
        <h2>🖼️ Mi Universidad 🖼️</h2>
        <div className="galeria-grid">
          {['1', '2', '3'].map((num) => (
            <div key={num} className="galeria-item">
            <img 
              src={`Imagenes/uci1${num}.jpg`} 
              alt={`Universidad ${num}`} 
              className="galeria-imagen"
              onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}/>
            <div className="galeria-placeholder">
              {[
              'Campus Principal',
              'Edificio de Aulas', 
              'Biblioteca Central',
              ][num - 1]}
            </div>
            </div>
            ))}
          </div>
      </section>
    <Footer/>
    </div>
  );
}

export default Inicio;
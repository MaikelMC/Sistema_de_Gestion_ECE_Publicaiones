import React from 'react';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="error-page notfound-wrapper">
      <div className="error-card">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>La página que buscas no existe o fue movida. Verifica la URL o vuelve al inicio.</p>
        <a className="btn-home" href="/">Ir al inicio</a>
      </div>
    </div>
  );
}

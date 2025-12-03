import React from 'react';
import './Forbidden.css';

export default function Forbidden(){
  return (
    <div className="error-page forbidden-wrapper">
      <div className="error-card">
        <h1>403</h1>
        <h2>Acceso denegado</h2>
        <p>No tienes permisos para ver esta página.</p>
        <a className="btn-home" href="/">Ir al inicio</a>
      </div>
    </div>
  );
}

import React from 'react';
import './ServerError.css';

export default function ServerError(){
  return (
    <div className="error-page server-wrapper">
      <div className="error-card">
        <h1>500</h1>
        <h2>Error interno del servidor</h2>
        <p>Ocurrió un problema en el servidor. Intenta de nuevo más tarde.</p>
        <a className="btn-home" href="/">Ir al inicio</a>
      </div>
    </div>
  );
}

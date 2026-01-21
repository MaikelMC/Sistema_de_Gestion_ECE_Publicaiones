// src/pages/JefeDepartamento/OpinionesJefe/OpinionesJefe.jsx
import './OpinionesJefe.css';
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

function OpinionesJefe() {
  const [opiniones, setOpiniones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [sugerenciasEstudiantes, setSugerenciasEstudiantes] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [estudiantesFiltrados, setEstudiantesFiltrados] = useState([]);

  useEffect(() => {
    cargarOpiniones();
  }, []);

  const cargarOpiniones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener todas las opiniones sobre estudiantes
      const response = await api.get('/publications/student-opinions/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      console.log('📋 Opiniones de estudiantes cargadas:', data);
      setOpiniones(data);
      setEstudiantesFiltrados(data);
      
    } catch (err) {
      console.error('Error al cargar opiniones:', err);
      setError('Error al cargar las opiniones. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const manejarCambioBusqueda = (valor) => {
    setBusquedaEstudiante(valor);
    if (valor.trim()) {
      const estudiantesUnicos = [...new Set(opiniones.map(op => op.student_name))];
      const sugerencias = estudiantesUnicos.filter(est =>
        est.toLowerCase().includes(valor.toLowerCase())
      );
      setSugerenciasEstudiantes(sugerencias);
      setMostrarSugerencias(true);
    } else {
      setSugerenciasEstudiantes([]);
      setMostrarSugerencias(false);
      setEstudiantesFiltrados(opiniones);
    }
  };

  const seleccionarEstudiante = (estudiante) => {
    setBusquedaEstudiante(estudiante);
    setMostrarSugerencias(false);
    const filtradas = opiniones.filter(op => op.student_name === estudiante);
    setEstudiantesFiltrados(filtradas);
  };

  const descargarOpinion = (opinion) => {
    if (opinion.file_url) {
      window.open(opinion.file_url, '_blank');
    } else {
      toast.warning('No hay archivo disponible para descargar');
    }
  };

  const opinionesMostradas = busquedaEstudiante.trim() 
    ? estudiantesFiltrados 
    : opiniones;

  if (loading) {
    return (
      <div className="opiniones-jefe-page">
        <header className="page-header">
          <h1>⏳ Cargando opiniones...</h1>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="opiniones-jefe-page">
        <header className="page-header">
          <h1>⚠️ Opiniones de Tutores</h1>
          <p>{error}</p>
        </header>
        <section className="card">
          <button onClick={cargarOpiniones} className="btn-primario">
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="opiniones-jefe-page">
      <header className="page-header">
        <h1>💬 Opiniones de Tutores</h1>
        <p>Revisa las opiniones que los tutores han emitido sobre los estudiantes</p>
      </header>

      {/* Búsqueda de Estudiante */}
      <div className="filtros-section">
        <div style={{ position: 'relative', flex: 1 }}>
          <input 
            type="text"
            placeholder="🔍 Busca un estudiante..."
            value={busquedaEstudiante}
            onChange={(e) => manejarCambioBusqueda(e.target.value)}
            onFocus={() => busquedaEstudiante && setMostrarSugerencias(true)}
            className="filtro-select"
            style={{ width: '100%' }}
          />
          {mostrarSugerencias && sugerenciasEstudiantes.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              {sugerenciasEstudiantes.map((estudiante, idx) => (
                <div
                  key={idx}
                  onClick={() => seleccionarEstudiante(estudiante)}
                  style={{
                    padding: '10px 15px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  👤 {estudiante}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Opiniones */}
      {opinionesMostradas.length === 0 ? (
        <div className="no-opinions">
          <p>📭 No hay opiniones disponibles</p>
        </div>
      ) : (
        <div className="opiniones-grid">
          {opinionesMostradas.map((opinion, idx) => (
            <div key={idx} className="opinion-card">
              <div className="opinion-header">
                <div className="opinion-info">
                  <h3>👤 {opinion.student_name}</h3>
                  <p className="tutor-name">👨‍🏫 Tutor: {opinion.tutor_name || opinion.tutor}</p>
                </div>
              </div>
              <div className="opinion-meta">
                <span className="date">📅 {new Date(opinion.created_at).toLocaleDateString('es-ES')}</span>
              </div>
              <div className="opinion-actions">
                <button 
                  onClick={() => descargarOpinion(opinion)}
                  className="btn-descargar"
                  title="Descargar opinión"
                >
                  📥 Descargar Opinión
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OpinionesJefe;

// src/pages/Tutor/OpinionesTutor/OpinionesTutor.jsx - SIMPLIFICADO SIN MODAL
import './OpinionesTutor.css';
import React, { useState, useEffect } from 'react';
import tutorService from '../../../services/tutorService';
import { toast } from 'react-toastify';

function OpinionesTutor() {
  const [estudiantesPendientes, setEstudiantesPendientes] = useState([]);
  const [opinionesEmitidas, setOpinionesEmitidas] = useState([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [sugerenciasEstudiantes, setSugerenciasEstudiantes] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar estudiantes pendientes de opinión
      console.log('⏳ Llamando API: getPendingStudentsForOpinion()');
      const pendientes = await tutorService.getPendingStudentsForOpinion();
      console.log('📥 Respuesta completa:', pendientes);
      console.log('📥 Tipo:', typeof pendientes);
      console.log('📥 Es Array?', Array.isArray(pendientes));
      console.log('📥 Longitud:', pendientes?.length);
      
      if (Array.isArray(pendientes)) {
        if (pendientes.length > 0) {
          console.log('✅ Primer estudiante:', pendientes[0]);
          console.log('📋 Todos los estudiantes:', pendientes.map(e => ({ 
            id: e.id, 
            student_name: e.student_name, 
            student_email: e.student_email,
            student: e.student
          })));
        } else {
          console.log('⚠️ Array vacío - No hay estudiantes pendientes');
        }
      } else {
        console.log('❌ Respuesta NO es un array:', pendientes);
      }
      
      setEstudiantesPendientes(pendientes || []);

      // Cargar opiniones ya emitidas
      const opiniones = await tutorService.getStudentOpinions();
      setOpinionesEmitidas(opiniones || []);

    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      setError('Error al cargar los datos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const manejarCambioBusqueda = (valor) => {
    console.log('🔍 Buscando:', valor);
    console.log('📚 Total de estudiantes disponibles:', estudiantesPendientes.length);
    setBusquedaEstudiante(valor);
    if (valor.trim()) {
      const sugerencias = estudiantesPendientes.filter(est =>
        est.student_name?.toLowerCase().includes(valor.toLowerCase()) ||
        est.student_email?.toLowerCase().includes(valor.toLowerCase())
      );
      console.log('✅ Sugerencias encontradas:', sugerencias.length, sugerencias);
      setSugerenciasEstudiantes(sugerencias);
      setMostrarSugerencias(true);
    } else {
      // Si está vacío, mostrar TODOS los estudiantes
      console.log('📋 Mostrando todos los estudiantes:', estudiantesPendientes.length);
      setSugerenciasEstudiantes(estudiantesPendientes);
      setMostrarSugerencias(true);
    }
  };

  const manejarFocusInput = () => {
    // Cuando se enfoca el input, mostrar TODOS los estudiantes pendientes
    console.log('📍 Input enfocado - mostrando todos los estudiantes:', estudiantesPendientes.length);
    setSugerenciasEstudiantes(estudiantesPendientes);
    setMostrarSugerencias(true);
  };

  const manejarBlurInput = () => {
    // Cuando se pierde el foco, ocultamos las sugerencias después de un delay
    // para permitir que el usuario haga click en una sugerencia
    setTimeout(() => {
      setMostrarSugerencias(false);
    }, 200);
  };

  const seleccionarEstudiante = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setBusquedaEstudiante('');
    setMostrarSugerencias(false);
    setSugerenciasEstudiantes([]);
  };

  const limpiarSeleccion = () => {
    setEstudianteSeleccionado(null);
    setFile(null);
    setBusquedaEstudiante('');
    setSugerenciasEstudiantes([]);
    setMostrarSugerencias(false);
  };

  const emitirOpinion = async () => {
    if (!estudianteSeleccionado) {
      toast.warning('Por favor, selecciona un estudiante.');
      return;
    }
    if (!file) {
      toast.warning('Por favor, sube un archivo con tu opinión.');
      return;
    }

    try {
      setLoading(true);

      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('student', estudianteSeleccionado.student);
      formData.append('file', file);

      // Enviar opinión al backend
      await tutorService.uploadStudentOpinion(formData);

      toast.success('✅ Opinión emitida correctamente');
      
      // Recargar datos
      await cargarDatos();
      
      // Resetear formulario
      limpiarSeleccion();

    } catch (err) {
      console.error('Error al emitir opinión:', err);
      toast.error('❌ Error al emitir la opinión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const descargarOpinion = (urlArchivo) => {
    if (urlArchivo) {
      window.open(urlArchivo, '_blank');
    } else {
      toast.error('No hay archivo disponible para descargar');
    }
  };

  return (
    <div className="opiniones-tutor">
      <header className="page-header">
        <h1>💭 Opiniones de Estudiantes</h1>
        <p>Emite opiniones sobre el desempeño académico de tus estudiantes</p>
      </header>

      {/* Error */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={cargarDatos} className="btn-retry">Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>⏳ Cargando datos...</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="opiniones-grid">
            {/* Sección: Emitir Opinión */}
            <section className="card emitir-opinion-section">
              <div className="section-header">
                <h2>📝 Emitir una Opinión</h2>
              </div>

              {estudianteSeleccionado ? (
                // Mostrar formulario para cargar opinión
                <div className="opinion-form-container">
                  {/* Información del estudiante seleccionado */}
                  <div className="estudiante-info-modal">
                    <h3>👤 {estudianteSeleccionado.student_name}</h3>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                      📧 {estudianteSeleccionado.student_email}
                    </p>
                  </div>

                  {/* Input de archivo */}
                  <div className="form-group">
                    <label htmlFor="file-input">📄 Cargar archivo de opinión:</label>
                    <input
                      id="file-input"
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0])}
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                      className="file-input"
                      disabled={loading}
                    />
                    {file && (
                      <div className="file-info">
                        📎 <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                      </div>
                    )}
                    <small>✓ Formatos aceptados: PDF, DOC, DOCX, TXT, XLS, XLSX</small>
                  </div>

                  {/* Botones de acción */}
                  <div className="form-actions">
                    <button 
                      className="btn-confirmar"
                      onClick={emitirOpinion}
                      disabled={!file || loading}
                    >
                      {loading ? '⏳ Enviando...' : '📨 Emitir Opinión'}
                    </button>
                    <button 
                      className="btn-cancelar-form"
                      onClick={limpiarSeleccion}
                      disabled={loading}
                    >
                      ← Cambiar Estudiante
                    </button>
                  </div>
                </div>
              ) : (
                // Mostrar buscador de estudiantes
                <div className="buscar-estudiante-section">
                  <label htmlFor="busqueda-estudiante" style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>
                    🔍 Selecciona un estudiante:
                  </label>
                  <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <input
                      id="busqueda-estudiante"
                      type="text"
                      value={busquedaEstudiante}
                      onChange={(e) => manejarCambioBusqueda(e.target.value)}
                      onFocus={manejarFocusInput}
                      onBlur={manejarBlurInput}
                      placeholder="Escribe el nombre o email del estudiante..."
                      className="filtro-select"
                      style={{ width: '100%', padding: '10px' }}
                    />

                    {/* Dropdown de sugerencias */}
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
                        maxHeight: '400px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        {sugerenciasEstudiantes.map((est) => (
                          <div
                            key={est.id}
                            onClick={() => seleccionarEstudiante(est)}
                            style={{
                              padding: '12px 15px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <div style={{ fontWeight: 500 }}>👤 {est.student_name}</div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>📧 {est.student_email}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mensaje cuando no hay sugerencias */}
                    {mostrarSugerencias && sugerenciasEstudiantes.length === 0 && busquedaEstudiante.trim() && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderTop: 'none',
                        borderRadius: '0 0 6px 6px',
                        padding: '12px 15px',
                        color: '#6b7280',
                        zIndex: 10
                      }}>
                        No se encontraron estudiantes
                      </div>
                    )}
                  </div>

                  {/* Área para cargar documento (visible siempre en buscador) */}
                  <div className="form-group">
                    <label htmlFor="file-input-default">📄 Cargar archivo de opinión:</label>
                    <input
                      id="file-input-default"
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0])}
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                      className="file-input"
                      disabled={loading}
                    />
                    {file && (
                      <div className="file-info">
                        📎 <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                      </div>
                    )}
                    <small>✓ Formatos aceptados: PDF, DOC, DOCX, TXT, XLS, XLSX</small>
                  </div>
                </div>
              )}
            </section>

            {/* Sección: Historial de Opiniones Emitidas */}
            <section className="card emitidas-section">
              <div className="section-header">
                <h2>📊 Historial de Opiniones Emitidas</h2>
              </div>

              {opinionesEmitidas.length === 0 ? (
                <div className="no-data">
                  <p>📝 No hay opiniones emitidas</p>
                  <p className="hint">Las opiniones que emitas aparecerán aquí</p>
                </div>
              ) : (
                <div className="opiniones-list">
                  {opinionesEmitidas.map(opinionItem => (
                    <div key={opinionItem.id} className="opinion-item">
                      <div className="opinion-header">
                        <h3>👤 {opinionItem.student_name}</h3>
                        <span className="opinion-date">
                          📅 {new Date(opinionItem.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      
                      <div className="opinion-actions">
                        {opinionItem.file_url && (
                          <button 
                            className="btn-descargar"
                            onClick={() => descargarOpinion(opinionItem.file_url)}
                          >
                            📥 Descargar Opinión
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default OpinionesTutor;
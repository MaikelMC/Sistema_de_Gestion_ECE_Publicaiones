// src/pages/JefeDepartamento/GestionPublicaciones/GestionPublicaciones.jsx
import './GestionPublicasiones.css';
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

function GestionPublicasiones() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    aprobadas: 0,
    rechazadas: 0,
    pendientes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroEstudiante, setFiltroEstudiante] = useState('');
  const [sugerenciasEstudiantes, setSugerenciasEstudiantes] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [comentario, setComentario] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarPublicaciones();
  }, []);

  const cargarPublicaciones = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener TODAS las publicaciones (no solo pendientes)
      const response = await api.get('/publications/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      console.log('📚 Publicaciones cargadas:', data);
      
      setPublicaciones(data);
      
      // Calcular estadísticas
      const statsCalculated = {
        total: data.length,
        aprobadas: data.filter(p => p.status === 'approved').length,
        rechazadas: data.filter(p => p.status === 'rejected').length,
        pendientes: data.filter(p => p.status === 'pending').length
      };
      
      console.log('📊 Estadísticas:', statsCalculated);
      setStats(statsCalculated);
      
    } catch (err) {
      console.error('Error al cargar publicaciones:', err);
      setError('Error al cargar las publicaciones. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstudiantesUnicos = () => {
    const estudiantes = new Set();
    publicaciones.forEach(pub => {
      if (pub.student_name) {
        // Extraer solo nombre y apellido (sin usuario si está entre paréntesis)
        const nombreLimpio = pub.student_name.includes('(') 
          ? pub.student_name.substring(0, pub.student_name.indexOf('(')).trim()
          : pub.student_name;
        estudiantes.add(nombreLimpio);
      }
    });
    return Array.from(estudiantes).sort();
  };

  const manejarCambioEstudiante = (valor) => {
    setFiltroEstudiante(valor);
    if (valor.trim()) {
      const todos = obtenerEstudiantesUnicos();
      const sugerencias = todos.filter(est => 
        est.toLowerCase().includes(valor.toLowerCase())
      );
      setSugerenciasEstudiantes(sugerencias);
      setMostrarSugerencias(true);
    } else {
      setSugerenciasEstudiantes([]);
      setMostrarSugerencias(false);
    }
  };

  const seleccionarEstudiante = (estudiante) => {
    setFiltroEstudiante(estudiante);
    setMostrarSugerencias(false);
  };

  const filtrarPublicaciones = () => {
    let filtered = publicaciones;

    // Filtro por nivel
    if (filtroNivel !== 'todos') {
      filtered = filtered.filter(pub => pub.nivel === filtroNivel);
    }

    // Filtro por estudiante
    if (filtroEstudiante.trim()) {
      filtered = filtered.filter(pub => 
        pub.student_name && pub.student_name.toLowerCase().includes(filtroEstudiante.toLowerCase())
      );
    }

    // Búsqueda por título, autor o estudiante
    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      filtered = filtered.filter(pub => 
        pub.title.toLowerCase().includes(searchLower) ||
        pub.authors.toLowerCase().includes(searchLower) ||
        (pub.student_name && pub.student_name.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  };

  const aprobarPublicacion = async (id, nuevoNivel) => {
    try {
      setProcesando(true);
      
      console.log('📤 Enviando aprobación para publicación ID:', id);
      console.log('Datos enviados:', { is_approved: true, comments: comentario || 'Publicación aprobada' });
      
      const response = await api.post(`/publications/${id}/review/`, {
        is_approved: true,
        comments: comentario || 'Publicación aprobada'
      });
      
      console.log('✅ Respuesta del servidor:', response.data);
      toast.success('✅ Publicación aprobada');
      
      // Recargar publicaciones
      await cargarPublicaciones();
      setPublicacionSeleccionada(null);
      setComentario('');
    } catch (err) {
      console.error('❌ Error al aprobar publicación:', err);
      console.error('Response data:', err.response?.data);
      console.error('Status:', err.response?.status);
      console.error('Headers:', err.response?.headers);
      
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || 'Error desconocido';
      toast.error(`❌ Error al aprobar la publicación: ${errorMsg}`);
    } finally {
      setProcesando(false);
    }
  };

  const rechazarPublicacion = async (id) => {
    if (!comentario.trim()) {
      toast.warning('Por favor, agrega un comentario explicando el rechazo.');
      return;
    }

    try {
      setProcesando(true);
      
      await api.post(`/publications/${id}/review/`, {
        is_approved: false,
        comments: comentario
      });
      
      toast.success('❌ Publicación rechazada correctamente');
      
      // Recargar publicaciones
      await cargarPublicaciones();
      setPublicacionSeleccionada(null);
      setComentario('');
    } catch (err) {
      console.error('Error al rechazar publicación:', err);
      console.error('Detalles del error:', err.response?.data);
      toast.error('❌ Error al rechazar la publicación');
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'en_proceso': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getEstadoTexto = (status) => {
    switch (status) {
      case 'approved': return '✅ Aprobada';
      case 'rejected': return '❌ Rechazada';
      case 'pending': return '⏳ Pendiente';
      case 'en_proceso': return '🔄 En Proceso';
      default: return '📝 Desconocido';
    }
  };

  const getNivelColor = (nivel) => {
    switch (nivel) {
      case '1': return '#ef4444'; // Rojo - Básico
      case '2': return '#f59e0b'; // Amarillo - Intermedio
      case '3': return '#10b981'; // Verde - Avanzado
      default: return '#6b7280'; // Gris
    }
  };

  const getNivelTexto = (nivel) => {
    switch (nivel) {
      case '1': return 'Nivel 1 - Básico';
      case '2': return 'Nivel 2 - Intermedio';
      case '3': return 'Nivel 3 - Avanzado';
      default: return 'Sin clasificar';
    }
  };

  const publicacionesFiltradas = filtrarPublicaciones();

  return (
    <div className="gestion-publicaciones-page">
      <header className="page-header">
        <h1>📚 Gestión de Publicaciones</h1>
        <p>Revisa y gestiona las publicaciones académicas de los estudiantes</p>
      </header>

      {/* Error */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={cargarPublicaciones} className="btn-retry">
            Reintentar
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>⏳ Cargando publicaciones...</p>
        </div>
      )}

      {/* Estadísticas */}
      {!loading && (
        <section className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-info">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total de Publicaciones</div>
            </div>
          </div>
        </section>
      )}

      {/* Contenido */}
      {!loading && !error && (
        <>
          {/* Filtros y Búsqueda */}
          <div className="filtros-section">
            <h2 className="letrero">Busca por niveles o por estudiante</h2>
            <div className="filtros-left">
              <select 
                value={filtroNivel} 
                onChange={(e) => setFiltroNivel(e.target.value)}
                className="filtro-select"
              >
                <option value="todos">Todos los niveles</option>
                <option value="1">Nivel 1</option>
                <option value="2">Nivel 2</option>
                <option value="3">Nivel 3</option>
              </select>

              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text"
                  placeholder="Buscar por nombre de estudiante..."
                  value={filtroEstudiante}
                  onChange={(e) => manejarCambioEstudiante(e.target.value)}
                  onFocus={() => filtroEstudiante.trim() && setMostrarSugerencias(true)}
                  className="filtro-select"
                  style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box' }}
                />
                {mostrarSugerencias && sugerenciasEstudiantes.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    minWidth: '200px'
                  }}>
                    {sugerenciasEstudiantes.map((estudiante, idx) => (
                      <div
                        key={idx}
                        onClick={() => seleccionarEstudiante(estudiante)}
                        style={{
                          padding: '12px 14px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: '#fafafa',
                          whiteSpace: 'nowrap',
                          overflow: 'visible',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#efefef'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                        title={estudiante}
                      >
                        👤 {estudiante}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

      {/* Lista de Publicaciones */}
      <div className="publicaciones-list">
        {publicacionesFiltradas.length === 0 ? (
          <div className="no-data">
            <p>📝 No hay publicaciones que coincidan con los filtros</p>
          </div>
        ) : (
          publicacionesFiltradas.map((publicacion) => (
            <div key={publicacion.id} className="publicacion-card">
              <div className="publicacion-header">
                <div className="publicacion-info">
                  <h3>{publicacion.title}</h3>
                  <div className="publicacion-meta">
                    <span className="autores">👤 {publicacion.authors}</span>
                    <span className="estudiante">🎓 {publicacion.student_name}</span>
                    <span className="fecha">📅 {new Date(publicacion.created_at).toLocaleDateString('es-ES')}</span>
                    {publicacion.journal && (
                      <span className="revista">📖 {publicacion.journal}</span>
                    )}
                  </div>
                </div>
                <div className="publicacion-estados">
                  <div 
                    className="nivel-badge"
                    style={{ 
                      backgroundColor: getNivelColor(publicacion.nivel),
                      color: 'white'
                    }}
                  >
                    Nivel {publicacion.nivel}
                  </div>
                  <div className={`estado-badge publicado-badge`}>
                    Publicado
                  </div>
                </div>
              </div>

              <div className="publicacion-actions">
                <button 
                  className="btn-ver"
                  onClick={() => setPublicacionSeleccionada(publicacion)}
                >
                  👁️ Ver Detalles
                </button>
                
                {publicacion.status === 'pending' && (
                  <>
                    <button 
                      className="btn-aprobar"
                      onClick={() => aprobarPublicacion(publicacion.id)}
                      disabled={procesando}
                    >
                      ✅ Aprobar
                    </button>
                    <button 
                      className="btn-rechazar"
                      onClick={() => setPublicacionSeleccionada(publicacion)}
                      disabled={procesando}
                    >
                      ❌ Rechazar
                    </button>
                  </>
                )}
                
                {publicacion.file_url && (
                  <a 
                    href={publicacion.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-descargar"
                  >
                    📥 Descargar PDF
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Detalles/Rechazo */}
      {publicacionSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {publicacionSeleccionada.estado === 'aprobada' 
                  ? 'Rechazar Publicación' 
                  : 'Detalles de Publicación'
                }
              </h2>
              <button 
                className="btn-cerrar"
                onClick={() => {
                  setPublicacionSeleccionada(null);
                  setComentario('');
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="publicacion-detalle">
                <h3>{publicacionSeleccionada.title}</h3>
                
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <strong>Autores:</strong> {publicacionSeleccionada.authors}
                  </div>
                  <div className="detalle-item">
                    <strong>Estudiante:</strong> {publicacionSeleccionada.student_name}
                  </div>
                  <div className="detalle-item">
                    <strong>Fecha:</strong> {new Date(publicacionSeleccionada.created_at).toLocaleDateString('es-ES')}
                  </div>
                  {publicacionSeleccionada.journal && (
                    <div className="detalle-item">
                      <strong>Revista:</strong> {publicacionSeleccionada.journal}
                    </div>
                  )}
                  {publicacionSeleccionada.volume && (
                    <div className="detalle-item">
                      <strong>Volumen:</strong> {publicacionSeleccionada.volume}
                    </div>
                  )}
                  {publicacionSeleccionada.pages && (
                    <div className="detalle-item">
                      <strong>Páginas:</strong> {publicacionSeleccionada.pages}
                    </div>
                  )}
                  <div className="detalle-item">
                    <strong>Nivel:</strong> 
                    <span 
                      className="nivel-text"
                      style={{ color: getNivelColor(publicacionSeleccionada.nivel) }}
                    >
                      {getNivelTexto(publicacionSeleccionada.nivel)}
                    </span>
                  </div>
                  <div className="detalle-item">
                    <strong>Estado:</strong> 
                    <span 
                      className="estado-text"
                      style={{ color: getEstadoColor(publicacionSeleccionada.status) }}
                    >
                      {getEstadoTexto(publicacionSeleccionada.status)}
                    </span>
                  </div>
                </div>

                <div className="resumen-completo">
                  <strong>Resumen:</strong>
                  <p>{publicacionSeleccionada.resumen || publicacionSeleccionada.abstract || 'No especificado'}</p>
                </div>

                {publicacionSeleccionada.status === 'pending' && (
                  <div className="comentario-section">
                    <label htmlFor="comentario">
                      Comentario (opcional para aprobación, obligatorio para rechazo):
                    </label>
                    <textarea
                      id="comentario"
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Explica los motivos del rechazo o añade comentarios..."
                      rows="4"
                      className="comentario-textarea"
                    />
                  </div>
                )}

                {publicacionSeleccionada.status === 'rejected' && publicacionSeleccionada.comments && (
                  <div className="comentario-section">
                    <strong>Motivo de rechazo:</strong>
                    <p className="comentario-text">{publicacionSeleccionada.comments}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              {publicacionSeleccionada.status === 'pending' ? (
                <>
                  <button 
                    className="btn-aprobar"
                    onClick={() => {
                      aprobarPublicacion(publicacionSeleccionada.id);
                    }}
                    disabled={procesando}
                  >
                    ✅ Aprobar
                  </button>
                  <button 
                    className="btn-confirmar-rechazo"
                    onClick={() => {
                      if (!comentario.trim()) {
                        toast.warning('Por favor, agrega un comentario explicando el rechazo.');
                        return;
                      }
                      rechazarPublicacion(publicacionSeleccionada.id);
                    }}
                    disabled={!comentario.trim() || procesando}
                  >
                    ❌ Rechazar
                  </button>
                  <button 
                    className="btn-cancelar"
                    onClick={() => {
                      setPublicacionSeleccionada(null);
                      setComentario('');
                    }}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button 
                  className="btn-cerrar"
                  onClick={() => {
                    setPublicacionSeleccionada(null);
                    setComentario('');
                  }}
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default GestionPublicasiones;
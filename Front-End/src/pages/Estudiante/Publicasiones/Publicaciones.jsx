// Publicaciones.jsx - INTEGRADO CON BACKEND
import './Publicaciones.css';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import publicationService from '../../../services/publicationService';
import { handleApiError, formatDateShort, getStatusLabel, getStatusColor, validateFile } from '../../../utils/helpers';
import Footer from '../../../components/footer';

function Publicaciones() {
  const [publicacionData, setPublicacionData] = useState({
    titulo: '',
    autores: '',
    fechaPublicacion: '',
    revista: '',
    volumen: '',
    paginas: '',
    doi: '',
    archivo: null,
    resumen: '',
    nivel: ''
  });

  const [publicaciones, setPublicaciones] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  // CARGAR PUBLICACIONES DESDE EL BACKEND AL INICIAR
  useEffect(() => {
    // Verificar autenticación antes de cargar
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
      window.location.href = '/login';
      return;
    }
    cargarPublicaciones();
  }, []);

  const cargarPublicaciones = async () => {
    try {
      setLoadingList(true);
      const data = await publicationService.getMyPublications();
      setPublicaciones(data);
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
      if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        handleApiError(error);
      }
    } finally {
      setLoadingList(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setPublicacionData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!publicacionData.titulo || !publicacionData.autores || !publicacionData.nivel) {
      toast.error('Por favor completa los campos obligatorios: Título, Autores y Nivel');
      return;
    }

    // Validar archivo si se subió uno nuevo
    if (publicacionData.archivo && typeof publicacionData.archivo !== 'string') {
      const validation = validateFile(publicacionData.archivo, 50, ['.pdf', '.doc', '.docx']);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    setLoading(true);

    try {
      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append('titulo', publicacionData.titulo);
      formData.append('autores', publicacionData.autores);
      formData.append('nivel', publicacionData.nivel);
      
      if (publicacionData.fechaPublicacion) formData.append('fecha_publicacion', publicacionData.fechaPublicacion);
      if (publicacionData.revista) formData.append('revista', publicacionData.revista);
      if (publicacionData.volumen) formData.append('volumen', publicacionData.volumen);
      if (publicacionData.paginas) formData.append('paginas', publicacionData.paginas);
      if (publicacionData.doi) formData.append('doi', publicacionData.doi);
      if (publicacionData.resumen) formData.append('resumen', publicacionData.resumen);
      
      // Solo agregar archivo si es un archivo nuevo (no una URL)
      if (publicacionData.archivo && typeof publicacionData.archivo !== 'string') {
        formData.append('archivo', publicacionData.archivo);
      }

      console.log('Datos a enviar:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      if (editandoId) {
        // MODO EDICIÓN
        await publicationService.update(editandoId, formData);
        toast.success('✅ Publicación actualizada correctamente');
      } else {
        // MODO NUEVO
        await publicationService.create(formData);
        toast.success('✅ Publicación agregada correctamente');
      }

      // Recargar lista de publicaciones
      await cargarPublicaciones();
      resetForm();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN PARA ELIMINAR PUBLICACIÓN
  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      try {
        await publicationService.delete(id);
        toast.success('🗑️ Publicación eliminada correctamente');
        
        // Si estamos editando esta publicación, cancelar edición
        if (editandoId === id) {
          resetForm();
        }
        
        // Recargar lista
        await cargarPublicaciones();
      } catch (error) {
        handleApiError(error);
      }
    }
  };
  // FUNCIÓN PARA EDITAR PUBLICACIÓN
  const handleEditar = (publicacion) => {
    setPublicacionData({
      titulo: publicacion.titulo || '',
      autores: publicacion.autores || '',
      fechaPublicacion: publicacion.fecha_publicacion || '',
      revista: publicacion.revista || '',
      volumen: publicacion.volumen || '',
      paginas: publicacion.paginas || '',
      doi: publicacion.doi || '',
      resumen: publicacion.resumen || '',
      nivel: publicacion.nivel || '',
      archivo: publicacion.archivo || null
    });
    setEditandoId(publicacion.id);
    
    // Hacer scroll al formulario
    setTimeout(() => {
      document.querySelector('.publicacion-form')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  };

  // FUNCIÓN PARA CANCELAR EDICIÓN
  const handleCancelarEdicion = () => {
    resetForm();
  };

  // FUNCIÓN PARA RESETEAR FORMULARIO
  const resetForm = () => {
    setPublicacionData({
      titulo: '',
      autores: '',
      fechaPublicacion: '',
      revista: '',
      volumen: '',
      paginas: '',
      doi: '',
      archivo: null,
      resumen: '',
      nivel: ''
    });
    setEditandoId(null);
    
    // Resetear input file
    const fileInput = document.getElementById('archivo');
    if (fileInput) fileInput.value = '';
  };

  // Función para enviar a revisión
  const enviarARevision = async (id) => {
    if (window.confirm('¿Estás seguro de enviar esta publicación a revisión?')) {
      try {
        await publicationService.submitForReview(id);
        toast.success('✅ Publicación enviada a revisión correctamente');
        await cargarPublicaciones();
      } catch (error) {
        handleApiError(error);
      }
    }
  };

  return (
    <div className="dash-page">
      <header className="panel-header">
        <img src="Imagenes/logouci.webp" alt="Logo UCI" className="profile-photo"/>
        <h1>Gestión de Publicaciones</h1>
      </header>

      {/* Formulario de Nueva Publicación */}
      <section className="card">
        <h2>
          {editandoId ? '✏️ Editar Publicación' : '📄 Agregar Nueva Publicación'}
          {editandoId && <span className="editando-badge">Editando</span>}
        </h2>
        
        <form onSubmit={handleSubmit} className="publicacion-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="titulo">Título de la Publicación *</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={publicacionData.titulo}
                onChange={handleInputChange}
                className="inputr"
                required
                placeholder="Ingresa el título completo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="autores">Autores *</label>
              <input
                type="text"
                id="autores"
                name="autores"
                value={publicacionData.autores}
                onChange={handleInputChange}
                className="inputr"
                required
                placeholder="Nombres de los autores separados por coma"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nivel">Nivel de la Publicación *</label>
              <select
                id="nivel"
                name="nivel"
                value={publicacionData.nivel}
                onChange={handleInputChange}
                className="inputr"
                required
              >
                <option value="">Selecciona un nivel</option>
                <option value="1">Nivel 1</option>
                <option value="2">Nivel 2</option>
                <option value="3">Nivel 3</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fechaPublicacion">Fecha de Publicación</label>
              <input
                type="date"
                id="fechaPublicacion"
                name="fechaPublicacion"
                value={publicacionData.fechaPublicacion}
                onChange={handleInputChange}
                className="inputr"
              />
            </div>

            <div className="form-group">
              <label htmlFor="revista">Revista/Conferencia</label>
              <input
                type="text"
                id="revista"
                name="revista"
                value={publicacionData.revista}
                onChange={handleInputChange}
                className="inputr"
                placeholder="Nombre de la revista o conferencia"
              />
            </div>

            <div className="form-group">
              <label htmlFor="paginas">Páginas</label>
              <input
                type="text"
                id="paginas"
                name="paginas"
                value={publicacionData.paginas}
                onChange={handleInputChange}
                className="inputr"
                placeholder="Ej: 123-135"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="resumen">Resumen</label>
              <textarea
                id="resumen"
                name="resumen"
                value={publicacionData.resumen}
                onChange={handleInputChange}
                className="inputr textarea"
                rows="4"
                placeholder="Resumen de la publicación..."
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="archivo">Documento de la Publicación</label>
              <input
                type="file"
                id="archivo"
                name="archivo"
                onChange={handleInputChange}
                className="inputr"
                accept=".pdf,.doc,.docx"
              />
              <small>Formatos aceptados: PDF, DOC, DOCX (Máx. 50MB)</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-upload" disabled={loading}>
              {loading ? '⏳ Guardando...' : editandoId ? '💾 Guardar Cambios' : '📤 Registrar Publicación'}
            </button>
            {editandoId && (
              <button 
                type="button" 
                className="btn-cancel"
                onClick={handleCancelarEdicion}
                disabled={loading}
              >
                ❌ Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Lista de Publicaciones Existentes */}
      <section className="card">
        <div className="publicaciones-header">
          <h2>📚 Mis Publicaciones Registradas</h2>
          <div className="publicaciones-info">
            <span>Total: {publicaciones.length}</span>
            <button 
              className="btn-refresh"
              onClick={cargarPublicaciones}
              title="Actualizar lista"
              disabled={loadingList}
            >
              {loadingList ? '⏳' : '🔄'}
            </button>
          </div>
        </div>

        {loadingList ? (
          <div className="no-data">
            <p>⏳ Cargando publicaciones...</p>
          </div>
        ) : publicaciones.length === 0 ? (
          <div className="no-data">
            <p>📝 Aún no tienes publicaciones registradas</p>
            <p className="hint">Usa el formulario de arriba para agregar tu primera publicación</p>
          </div>
        ) : (
          <div className="publicaciones-list">
            {publicaciones.map((pub) => (
              <div key={pub.id} className={`publicacion-item ${editandoId === pub.id ? 'editando' : ''}`}>
                <div className="publicacion-header">
                  <div className="publicacion-info">
                    <h3>{pub.titulo}</h3>
                    <div className="publicacion-meta">
                      <span 
                        className={`estado-badge estado-${pub.status || 'en_proceso'}`}
                        style={{ backgroundColor: getStatusColor(pub.status) }}
                      >
                        {getStatusLabel(pub.status)}
                      </span>
                      <span className="nivel-badge">Nivel {pub.nivel}</span>
                      <span className="fecha">{formatDateShort(pub.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="publicacion-details">
                  <p><strong>Estudiante:</strong> {pub.student_name || 'No especificado'}</p>
                  <p><strong>Matrícula:</strong> {pub.student_matricula || 'No especificada'}</p>
                  <p><strong>Autores:</strong> {pub.autores}</p>
                  {pub.revista && <p><strong>Revista:</strong> {pub.revista}</p>}
                  {pub.fecha_publicacion && <p><strong>Fecha de Publicación:</strong> {formatDateShort(pub.fecha_publicacion)}</p>}
                  {pub.volumen && <p><strong>Volumen:</strong> {pub.volumen}</p>}
                  {pub.paginas && <p><strong>Páginas:</strong> {pub.paginas}</p>}
                  {pub.doi && <p><strong>DOI:</strong> {pub.doi}</p>}
                  {pub.resumen && (
                    <p className="resumen"><strong>Resumen:</strong> {pub.resumen}</p>
                  )}
                  {pub.archivo && (
                    <p><strong>Archivo:</strong> <a href={pub.archivo} target="_blank" rel="noopener noreferrer">📎 Ver documento</a></p>
                  )}
                </div>

                <div className="publicacion-actions">
                  <button 
                    className="btn-small btn-editar"
                    onClick={() => handleEditar(pub)}
                    disabled={editandoId === pub.id || pub.status === 'pending'}
                  >
                    {editandoId === pub.id ? '✏️ Editando...' : '✏️ Editar'}
                  </button>
                  <button 
                    className="btn-small btn-danger"
                    onClick={() => handleEliminar(pub.id)}
                    disabled={editandoId === pub.id || pub.status === 'pending'}
                  >
                    🗑️ Eliminar
                  </button>
                  
                  {/* Botón para enviar a revisión */}
                  {pub.status === 'en_proceso' && (
                    <button 
                      className="btn-small btn-success"
                      onClick={() => enviarARevision(pub.id)}
                    >
                      📤 Enviar a Revisión
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Publicaciones;
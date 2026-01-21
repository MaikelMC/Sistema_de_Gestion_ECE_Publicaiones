// Publicaciones.jsx - INTEGRADO CON BACKEND
import './Publicaciones.css';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import publicationService from '../../../services/publicationService';
import authService from '../../../services/authService';
import showConfirm from '../../../utils/showConfirm';
import { handleApiError, formatDateShort, getStatusLabel, getStatusColor, validateFile } from '../../../utils/helpers';
import Footer from '../../../components/footer';

function Publicaciones() {
  const [publicacionData, setPublicacionData] = useState({
    titulo: '',
    autores: [''],
    fechaPublicacion: '',
    revista: '',
    volumen: '',
    paginas: '',
    doi: '',
    archivo: null,
    resumen: '',
    nivel: '',
    tutor: '',
    tutor_text: ''
  });

  const [publicaciones, setPublicaciones] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('form'); // 'form' | 'details'
  const [selectedPublicacion, setSelectedPublicacion] = useState(null);
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
    cargarTutores();
  }, []);

  // Evitar scroll doble cuando el modal está abierto
  useEffect(() => {
    if (showModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showModal]);

  const cargarPublicaciones = async () => {
    try {
      setLoadingList(true);
      const data = await publicationService.getMyPublications();
      // Some APIs return { results: [...] }
      const items = data && data.results ? data.results : data;
      setPublicaciones(items || []);
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

  const cargarTutores = async () => {
    try {
      const response = await authService.getTutores();
      const tutoresData = response || [];
      console.log('✅ Tutores cargados:', tutoresData);
      tutoresData.forEach(t => {
        console.log(`  ID: ${t.id}, Nombre: ${t.get_full_name || t.full_name || t.username}`);
      });
      setTutores(tutoresData);
    } catch (error) {
      console.error('❌ Error al cargar tutores:', error);
      toast.warning('No se pudo cargar la lista de tutores. Puedes continuar sin seleccionar uno.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    // Manejo especial para el campo de tutor con datalist (escribible + seleccionable)
    if (name === 'tutor_input') {
      // Si el usuario seleccionó una opción del datalist el valor tendrá el formato "<id> - <Nombre>"
      const m = String(value).match(/^(\d+)\s*-\s*(.+)$/);
      if (m) {
        const id = m[1];
        const display = m[2];
        setPublicacionData(prev => ({ ...prev, tutor: id, tutor_text: display }));
      } else {
        // Intentar encontrar por nombre (coincidencia exacta, case-insensitive)
        const found = tutores.find(t => {
          const display = t.get_full_name || t.full_name || `${t.first_name} ${t.last_name}`.trim() || t.username;
          return display.toLowerCase() === String(value).toLowerCase();
        });
        if (found) {
          const display = found.get_full_name || found.full_name || `${found.first_name} ${found.last_name}`.trim() || found.username;
          setPublicacionData(prev => ({ ...prev, tutor: found.id, tutor_text: display }));
        } else {
          // Usuario está escribiendo un nombre libre; no asignamos id
          setPublicacionData(prev => ({ ...prev, tutor: '', tutor_text: value }));
        }
      }
      return;
    }

    // Validación especial para campos numéricos
    if (name === 'volumen' && value) {
      // Solo permitir números en volumen
      if (!/^\d*$/.test(value)) {
        toast.warning('El volumen debe contener solo números');
        return;
      }
    }
    
    if (name === 'paginas' && value) {
      // Permitir números o rangos (ej: 123 o 123-135)
      if (!/^\d*(-\d*)?$/.test(value)) {
        toast.warning('Las páginas deben contener números o un rango (ej: 123-135)');
        return;
      }
    }
    
    setPublicacionData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleAuthorChange = (index, value) => {
    setPublicacionData(prev => {
      const arr = Array.isArray(prev.autores) ? [...prev.autores] : [prev.autores || ''];
      arr[index] = value;
      return { ...prev, autores: arr };
    });
  };

  const addAuthor = () => {
    setPublicacionData(prev => ({ ...prev, autores: [...(prev.autores || []), ''] }));
  };

  const removeAuthor = (index) => {
    setPublicacionData(prev => {
      const arr = [...(prev.autores || [])];
      arr.splice(index, 1);
      if (arr.length === 0) arr.push('');
      return { ...prev, autores: arr };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    const authorsArray = Array.isArray(publicacionData.autores) ? publicacionData.autores.map(a => String(a || '').trim()).filter(a => a) : [];
    if (!publicacionData.titulo || authorsArray.length === 0 || !publicacionData.nivel) {
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
      // Note: backend uses Spanish aliases for create but English field names for update.
      // join authors into a single string for backend
      const authorsString = (Array.isArray(publicacionData.autores) ? publicacionData.autores : [publicacionData.autores || ''])
        .map(a => String(a || '').trim())
        .filter(a => a)
        .join(', ');

      if (editandoId) {
        // Use English keys expected by PublicationUpdateSerializer
        formData.append('title', publicacionData.titulo || publicacionData.title || '');
        formData.append('authors', authorsString);
        if (publicacionData.fechaPublicacion) formData.append('publication_date', publicacionData.fechaPublicacion);
        if (publicacionData.revista) formData.append('journal', publicacionData.revista);
        if (publicacionData.volumen) formData.append('volume', publicacionData.volumen);
        if (publicacionData.paginas) formData.append('pages', publicacionData.paginas);
        if (publicacionData.doi) formData.append('doi', publicacionData.doi);
        if (publicacionData.resumen) formData.append('abstract', publicacionData.resumen);
        if (publicacionData.nivel) formData.append('nivel', publicacionData.nivel);
        // Solo enviar tutor si es un ID válido que existe en la lista
        if (publicacionData.tutor && Number.isInteger(parseInt(publicacionData.tutor))) {
          const tutorExiste = tutores.some(t => t.id === parseInt(publicacionData.tutor));
          if (tutorExiste) {
            formData.append('tutor', publicacionData.tutor);
          }
        }
        // Solo agregar archivo si es un archivo nuevo (File), no una URL string
        if (publicacionData.archivo && typeof publicacionData.archivo !== 'string') {
          formData.append('file', publicacionData.archivo);
        }
      } else {
        // Create: use Spanish alias fields that CreateSerializer accepts
        formData.append('titulo', publicacionData.titulo || publicacionData.title || '');
        formData.append('autores', authorsString || publicacionData.autores || publicacionData.authors || '');
        formData.append('nivel', publicacionData.nivel);
        if (publicacionData.fechaPublicacion) formData.append('fecha_publicacion', publicacionData.fechaPublicacion);
        if (publicacionData.revista) formData.append('revista', publicacionData.revista);
        if (publicacionData.volumen) formData.append('volumen', publicacionData.volumen);
        if (publicacionData.paginas) formData.append('paginas', publicacionData.paginas);
        if (publicacionData.doi) formData.append('doi', publicacionData.doi);
        if (publicacionData.resumen) formData.append('resumen', publicacionData.resumen);
        
        // Solo enviar tutor si es un ID válido que existe en la lista
        if (publicacionData.tutor) {
          const tutorId = parseInt(publicacionData.tutor);
          console.log('🔍 Verificando tutor:', { tutorId, tutor_text: publicacionData.tutor_text });
          console.log('   Tutores disponibles:', tutores.map(t => ({ id: t.id, nombre: t.get_full_name || t.full_name || t.username })));
          
          if (!Number.isInteger(tutorId)) {
            console.warn('⚠️ Tutor inválido (no es número):', publicacionData.tutor);
          } else {
            const tutorExiste = tutores.some(t => t.id === tutorId);
            if (tutorExiste) {
              console.log('✅ Tutor válido encontrado, agregando al formulario');
              formData.append('tutor', tutorId);
            } else {
              console.warn('⚠️ Tutor no existe en la lista:', tutorId);
            }
          }
        }
        
        if (publicacionData.archivo && typeof publicacionData.archivo !== 'string') {
          formData.append('archivo', publicacionData.archivo);
        }
      }

      console.log('Datos a enviar:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      if (editandoId) {
        // MODO EDICIÓN: actualizar y luego recargar lista desde backend
        await publicationService.update(editandoId, formData);
        toast.success('✅ Publicación actualizada correctamente');
        // Recargar lista completa para sincronizar con el servidor (evita discrepancias de campos)
        await cargarPublicaciones();
      } else {
        // MODO NUEVO: crear y recargar lista desde backend para mostrar la nueva publicación
        await publicationService.create(formData);
        toast.success('✅ Publicación agregada correctamente');
        await cargarPublicaciones();
      }
      resetForm();
      setShowModal(false);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN PARA ELIMINAR PUBLICACIÓN
  const handleEliminar = async (id) => {
    const ok = await showConfirm({ message: '¿Estás seguro de que quieres eliminar esta publicación?' });
    if (!ok) return;
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
  };
  // FUNCIÓN PARA EDITAR PUBLICACIÓN
  const handleEditar = (publicacion) => {
    setPublicacionData({
      titulo: publicacion.titulo || '',
      autores: publicacion.autores ? publicacion.autores.split(',').map(a => a.trim()).slice(0,3) : [''],
      fechaPublicacion: publicacion.fecha_publicacion || '',
      revista: publicacion.revista || '',
      volumen: publicacion.volumen || '',
      paginas: publicacion.paginas || '',
      doi: publicacion.doi || '',
      resumen: publicacion.resumen || '',
      nivel: publicacion.nivel || '',
      tutor: publicacion.tutor || '',
      tutor_text: publicacion.tutor_name || '',
      archivo: publicacion.archivo || null
    });
    setEditandoId(publicacion.id);
    // Abrir modal para edición
    setModalMode('form');
    setShowModal(true);
  };

  // Abrir modal para ver detalles
  const handleVerDetalles = (publicacion) => {
    setSelectedPublicacion(publicacion);
    setModalMode('details');
    setShowModal(true);
  };

  // FUNCIÓN PARA CANCELAR EDICIÓN
  const handleCancelarEdicion = () => {
    resetForm();
  };

  // FUNCIÓN PARA RESETEAR FORMULARIO
  const resetForm = () => {
    const currentUser = authService.getCurrentUser();
    const fullname = currentUser ? (currentUser.get_full_name || currentUser.full_name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username) : '';
    setPublicacionData({
      titulo: '',
      autores: [fullname || ''],
      fechaPublicacion: '',
      revista: '',
      volumen: '',
      paginas: '',
      doi: '',
      archivo: null,
      resumen: '',
      nivel: '',
      tutor: '',
      tutor_text: ''
    });
    setEditandoId(null);
    
    // Resetear input file
    const fileInput = document.getElementById('archivo');
    if (fileInput) fileInput.value = '';
  };

  // Nota: Envío a revisión deshabilitado — la aplicación no modificará el estado desde el cliente.

  return (
    <div className="dash-page">
      <header className="panel-header">
        <img src="Imagenes/logouci.webp" alt="Logo UCI" className="profile-photo"/>
        <h1>Gestión de Publicaciones</h1>
      </header>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0' }}>
        <h2 style={{ margin: 0 }}>📚 Mis Publicaciones</h2>
        <div>
          <button
            className="btn-primary"
            onClick={() => { resetForm(); setModalMode('form'); setShowModal(true); }}
          >
            ➕ Agregar publicación
          </button>
        </div>
      </div>

      {/* Modal para formulario de publicación */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <div className="modal-header">
              <h2>{modalMode === 'form' ? (editandoId ? '✏️ Editar Publicación' : '📄 Agregar Nueva Publicación') : '🔎 Detalles de la Publicación'}</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); resetForm(); setSelectedPublicacion(null); setModalMode('form'); }}>✕</button>
            </div>

            {modalMode === 'form' ? (
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
                <label>Autores *</label>
                {Array.isArray(publicacionData.autores) && publicacionData.autores.map((autor, idx) => (
                  <div key={idx} className="author-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="inputr author-input"
                      value={autor}
                      onChange={(e) => handleAuthorChange(idx, e.target.value)}
                      placeholder={`Autor ${idx + 1}`}
                      required={idx === 0}
                    />
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {publicacionData.autores.length > 1 && (
                        <button type="button" className="btn-small" onClick={() => removeAuthor(idx)}>Eliminar</button>
                      )}
                      {idx === publicacionData.autores.length - 1 && publicacionData.autores.length < 3 && (
                        <button type="button" className="btn-small" onClick={addAuthor}>Agregar</button>
                      )}
                    </div>
                  </div>
                ))}
                <small>Agrega hasta 3 autores. Puedes usar el botón + para añadir más.</small>
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
                <label htmlFor="tutor_input">Tutor (Opcional)</label>
                <input
                  list="tutores_list"
                  id="tutor_input"
                  name="tutor_input"
                  value={publicacionData.tutor_text || ''}
                  onChange={handleInputChange}
                  className="inputr"
                  placeholder="Escribe o selecciona un tutor"
                />
                <datalist id="tutores_list">
                  {tutores.map(tutor => {
                    const display = tutor.get_full_name || tutor.full_name || `${tutor.first_name} ${tutor.last_name}`.trim() || tutor.username;
                    return (
                      <option key={tutor.id} value={`${tutor.id} - ${display}`} />
                    );
                  })}
                </datalist>
                <small>Escribe para buscar o selecciona un tutor registrado</small>
              </div>

              <div className="form-group">
                <label htmlFor="fechaPublicacion">Fecha de Publicación</label>
                <input
                  type="date"
                  id="fechaPublicacion"
                  name="fechaPublicacion"
                  value={publicacionData.fechaPublicacion}
                  onChange={handleInputChange}
                  max={(() => {
                    const today = new Date();
                    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  })()}
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
                  pattern="\d+(-\d+)?"
                  title="Ingrese números o un rango (ej: 123-135)"
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
                {publicacionData.archivo && typeof publicacionData.archivo === 'string' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Documento actual:</strong>{' '}
                    <a href={publicacionData.archivo} target="_blank" rel="noopener noreferrer">📎 Ver documento</a>
                    <div style={{ fontSize: '0.85rem', color: '#555' }}>Si deseas reemplazarlo, selecciona un nuevo archivo aquí.</div>
                  </div>
                )}
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
            ) : (
              // Detalles mode
              <div className="publicacion-details-modal">
                {selectedPublicacion ? (
                  <div>
                    <h3 style={{ marginTop: 0 }}>{selectedPublicacion.titulo}</h3>
                    <div className="publicacion-meta" style={{ marginBottom: '0.5rem' }}>
                      <span className={`estado-badge publicado-badge`}>Publicado</span>
                      <span className="nivel-badge">Nivel {selectedPublicacion.nivel}</span>
                      <span className="fecha">{formatDateShort(selectedPublicacion.created_at)}</span>
                    </div>
                    <p><strong>Estudiante:</strong> {selectedPublicacion.student_name || 'No especificado'}</p>
                    <p><strong>Autores:</strong> {selectedPublicacion.autores}</p>
                    {selectedPublicacion.tutor_name && <p><strong>Tutor:</strong> {selectedPublicacion.tutor_name}</p>}
                    {selectedPublicacion.revista && <p><strong>Revista:</strong> {selectedPublicacion.revista}</p>}
                    {selectedPublicacion.fecha_publicacion && <p><strong>Fecha de Publicación:</strong> {formatDateShort(selectedPublicacion.fecha_publicacion)}</p>}
                    {selectedPublicacion.volumen && <p><strong>Volumen:</strong> {selectedPublicacion.volumen}</p>}
                    {selectedPublicacion.paginas && <p><strong>Páginas:</strong> {selectedPublicacion.paginas}</p>}
                    {selectedPublicacion.doi ? (
                      <p>
                        <strong>DOI:</strong>{' '}
                        <a href={`https://doi.org/${selectedPublicacion.doi}`} target="_blank" rel="noopener noreferrer">{selectedPublicacion.doi}</a>
                      </p>
                    ) : null}
                    {selectedPublicacion.resumen && <p className="resumen"><strong>Resumen:</strong> {selectedPublicacion.resumen}</p>}
                    {selectedPublicacion.archivo && <p><strong>Archivo:</strong> <a href={selectedPublicacion.archivo} target="_blank" rel="noopener noreferrer">📎 Ver documento</a></p>}
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-primary btn-cerrar"
                        onClick={() => { setShowModal(false); setSelectedPublicacion(null); setModalMode('form'); }}
                        title="Cerrar"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>No se encontró la publicación seleccionada.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Publicaciones Existentes */}
      {loadingList ? (
        <div className="no-data">
          <p>⏳ Cargando publicaciones...</p>
        </div>
      ) : publicaciones.length === 0 ? (
        <div className="no-data">
          <p>📝 Aún no tienes publicaciones registradas</p>
          <p className="hint">Haz clic en "Agregar publicación" para crear tu primera publicación</p>
        </div>
      ) : (
        <div className="publicaciones-list-container">
          <div className="publicaciones-list">
            {publicaciones.map((pub) => (
              <div key={pub.id} className={`publicacion-card ${editandoId === pub.id ? 'editando' : ''}`}>
                <div className="card-header-pub">
                  <h3 className="card-title">{pub.titulo}</h3>
                  <span className={`estado-badge publicado-badge`}>Publicado</span>
                </div>
                
                <div className="card-body-pub">
                  <div className="meta-row">
                    <span className="meta-item"><strong>Nivel:</strong> {pub.nivel}</span>
                    <span className="meta-item"><strong>Fecha:</strong> {formatDateShort(pub.created_at)}</span>
                  </div>
                  
                  {pub.autores && (
                    <div className="meta-row">
                      <span className="meta-item"><strong>Autores:</strong> {pub.autores}</span>
                    </div>
                  )}
                  
                  {pub.revista && (
                    <div className="meta-row">
                      <span className="meta-item"><strong>Revista:</strong> {pub.revista}</span>
                    </div>
                  )}
                </div>
                
                <div className="card-actions-pub">
                  <button 
                    className="btn-card-action btn-edit"
                    onClick={() => handleEditar(pub)}
                    disabled={editandoId === pub.id}
                    title="Editar publicación"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-card-action btn-details"
                    onClick={() => handleVerDetalles(pub)}
                    title="Ver detalles"
                  >
                    🔎 Detalles
                  </button>
                  {/* Envío a revisión deshabilitado: el estado no se modifica desde el cliente */}
                  <button 
                    className="btn-card-action btn-delete"
                    onClick={() => handleEliminar(pub.id)}
                    disabled={editandoId === pub.id}
                    title="Eliminar publicación"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Footer/>
    </div>
  );
}

export default Publicaciones;
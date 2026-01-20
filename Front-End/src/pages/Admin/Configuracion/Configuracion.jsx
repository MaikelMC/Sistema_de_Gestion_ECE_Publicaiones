import './Configuracion.css';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import config from '../../../config/config';

function Configuracion() {
  const [config, setConfig] = useState({
    nombre_universidad: 'Universidad de las Ciencias Informáticas',
    email_contacto: 'soporte@uci.cu',
    limite_solicitudes: 5,
    tiempo_sesion: 60,
    intentos_login_max: 5,
    tiempo_bloqueo: 30,
    requiere_2fa: false,
    notificaciones_email: true,
    backup_automatico: true,
    logs_detallados: true,
    validacion_email: true,
    longitud_minima_password: 8,
    require_uppercase: true,
    require_numbers: true,
    require_special_chars: true,
    password_expiration_days: 90
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await api.get(config.endpoints.SYSTEM_CONFIG);
      
      console.log('Configuración cargada:', response.data);
      
      // Convertir array de key-value a objeto
      if (response.data && Array.isArray(response.data)) {
        const configObj = {};
        response.data.forEach(item => {
          try {
            // Intentar parsear como JSON si es posible
            configObj[item.key] = JSON.parse(item.value);
          } catch {
            // Si no es JSON, usar el valor directamente
            configObj[item.key] = item.value;
          }
        });
        
        setConfig(prevConfig => ({
          ...prevConfig,
          ...configObj
        }));
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      // Usar valores por defecto si falla
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (campo, valor) => {
    setConfig(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const guardarConfiguracion = async () => {
    try {
      setSaving(true);
      setMensaje(null);

      // Convertir objeto a array de key-value para el backend
      const configArray = Object.entries(config).map(([key, value]) => ({
        key: key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        description: getDescriptionForKey(key)
      }));

      console.log('Guardando configuración:', configArray);

      // Guardar cada configuración individualmente
      const promises = configArray.map(async (item) => {
        try {
          // Intentar obtener la configuración existente
          const existing = await api.get(`${config.endpoints.SYSTEM_CONFIG}?key=${item.key}`);
          
          if (existing.data && existing.data.length > 0) {
            // Actualizar existente
            return await api.put(`${config.endpoints.SYSTEM_CONFIG}${existing.data[0].id}/`, item);
          } else {
            // Crear nuevo
            return await api.post(config.endpoints.SYSTEM_CONFIG, item);
          }
        } catch (error) {
          // Si no existe, crear
          return await api.post(config.endpoints.SYSTEM_CONFIG, item);
        }
      });

      await Promise.all(promises);

      setMensaje({ tipo: 'exito', texto: '✅ Configuración guardada correctamente' });
      
      // Actualizar tiempo de sesión en localStorage si cambió
      if (config.tiempo_sesion) {
        localStorage.setItem('session_timeout', config.tiempo_sesion.toString());
      }

    } catch (err) {
      console.error('Error al guardar configuración:', err);
      console.error('Detalles:', err.response?.data);
      setMensaje({ tipo: 'error', texto: '❌ Error al guardar la configuración' });
    } finally {
      setSaving(false);
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  const getDescriptionForKey = (key) => {
    const descriptions = {
      nombre_universidad: 'Nombre de la institución',
      email_contacto: 'Email de contacto principal',
      limite_solicitudes: 'Límite de solicitudes ECE por usuario',
      tiempo_sesion: 'Tiempo de sesión en minutos',
      intentos_login_max: 'Intentos máximos de login antes de bloqueo',
      tiempo_bloqueo: 'Tiempo de bloqueo en minutos',
      requiere_2fa: 'Requiere autenticación de dos factores',
      notificaciones_email: 'Enviar notificaciones por email',
      backup_automatico: 'Realizar backup automático',
      logs_detallados: 'Registrar logs detallados',
      validacion_email: 'Validación de email obligatoria',
      longitud_minima_password: 'Longitud mínima de contraseña',
      require_uppercase: 'Requiere mayúsculas en contraseña',
      require_numbers: 'Requiere números en contraseña',
      require_special_chars: 'Requiere caracteres especiales',
      password_expiration_days: 'Días para expiración de contraseña'
    };
    return descriptions[key] || key;
  };

  if (loading) {
    return (
      <div className="configuracion">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>⏳ Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="configuracion">
      <header className="panel-header">
        <h1>⚙️ Configuración del Sistema</h1>
        <p>Configura los parámetros globales y de seguridad de la aplicación</p>
      </header>

      {mensaje && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* Configuración General */}
      <section className="card">
        <h2>📋 Configuración General</h2>
        <div className="config-grid">
          <div className="config-item">
            <label>Nombre de la Universidad</label>
            <input 
              type="text" 
              value={config.nombre_universidad}
              onChange={(e) => handleChange('nombre_universidad', e.target.value)}
            />
          </div>
          <div className="config-item">
            <label>Email de Contacto</label>
            <input 
              type="email" 
              value={config.email_contacto}
              onChange={(e) => handleChange('email_contacto', e.target.value)}
            />
          </div>
          <div className="config-item">
            <label>Límite de Solicitudes por Usuario</label>
            <input 
              type="number" 
              min="1"
              max="20"
              value={config.limite_solicitudes}
              onChange={(e) => handleChange('limite_solicitudes', parseInt(e.target.value))}
            />
            <small>Máximo de solicitudes ECE activas simultáneas</small>
          </div>
          <div className="config-item">
            <label>Tiempo de Sesión (minutos)</label>
            <input 
              type="number" 
              min="15"
              max="480"
              value={config.tiempo_sesion}
              onChange={(e) => handleChange('tiempo_sesion', parseInt(e.target.value))}
            />
            <small>Duración antes de cerrar sesión automáticamente</small>
          </div>
        </div>
      </section>

      {/* Seguridad de Autenticación */}
      <section className="card">
        <h2>🔐 Seguridad de Autenticación</h2>
        <div className="config-grid">
          <div className="config-item">
            <label>Intentos Máximos de Login</label>
            <input 
              type="number" 
              min="3"
              max="10"
              value={config.intentos_login_max}
              onChange={(e) => handleChange('intentos_login_max', parseInt(e.target.value))}
            />
            <small>Intentos fallidos antes de bloquear cuenta</small>
          </div>
          <div className="config-item">
            <label>Tiempo de Bloqueo (minutos)</label>
            <input 
              type="number" 
              min="5"
              max="120"
              value={config.tiempo_bloqueo}
              onChange={(e) => handleChange('tiempo_bloqueo', parseInt(e.target.value))}
            />
            <small>Duración del bloqueo después de exceder intentos</small>
          </div>
          <div className="config-item config-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={config.requiere_2fa}
                onChange={(e) => handleChange('requiere_2fa', e.target.checked)}
              />
              Requerir Autenticación de Dos Factores (2FA)
            </label>
            <small>Mayor seguridad con verificación adicional</small>
          </div>
          <div className="config-item config-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={config.validacion_email}
                onChange={(e) => handleChange('validacion_email', e.target.checked)}
              />
              Validación de Email Obligatoria
            </label>
            <small>Los usuarios deben verificar su email</small>
          </div>
        </div>
      </section>

      {/* Políticas de Contraseñas */}
      <section className="card">
        <h2>🔑 Políticas de Contraseñas</h2>
        <div className="config-grid">
          <div className="config-item">
            <label>Longitud Mínima de Contraseña</label>
            <input 
              type="number" 
              min="6"
              max="20"
              value={config.longitud_minima_password}
              onChange={(e) => handleChange('longitud_minima_password', parseInt(e.target.value))}
            />
            <small>Caracteres mínimos requeridos</small>
          </div>
          <div className="config-item">
            <label>Expiración de Contraseña (días)</label>
            <input 
              type="number" 
              min="0"
              max="365"
              value={config.password_expiration_days}
              onChange={(e) => handleChange('password_expiration_days', parseInt(e.target.value))}
            />
            <small>0 = sin expiración</small>
          </div>
          <div className="config-item config-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={config.require_uppercase}
                onChange={(e) => handleChange('require_uppercase', e.target.checked)}
              />
              Requerir Letras Mayúsculas
            </label>
          </div>
          <div className="config-item config-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={config.require_numbers}
                onChange={(e) => handleChange('require_numbers', e.target.checked)}
              />
              Requerir Números
            </label>
          </div>
          <div className="config-item config-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={config.require_special_chars}
                onChange={(e) => handleChange('require_special_chars', e.target.checked)}
              />
              Requerir Caracteres Especiales
            </label>
            <small>Ejemplo: @, #, $, %, &</small>
          </div>
        </div>
      </section>

      {/* Sistema y Monitoreo */}
      <section className="card">
        <h2>📊 Sistema y Monitoreo</h2>
        <div className="config-grid">
          <div className="config-item config-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={config.notificaciones_email}
                onChange={(e) => handleChange('notificaciones_email', e.target.checked)}
              />
              Notificaciones por Email
            </label>
            <small>Enviar alertas importantes por correo</small>
          </div>
          <div className="config-item config-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={config.backup_automatico}
                onChange={(e) => handleChange('backup_automatico', e.target.checked)}
              />
              Backup Automático Diario
            </label>
            <small>Respaldo automático de la base de datos</small>
          </div>
          <div className="config-item config-checkbox">
            <label>
              <input 
                type="checkbox" 
                checked={config.logs_detallados}
                onChange={(e) => handleChange('logs_detallados', e.target.checked)}
              />
              Logs Detallados
            </label>
            <small>Registrar todas las acciones del sistema</small>
          </div>
        </div>
      </section>

      <div className="config-actions">
        <button 
          className="btn-guardar-config" 
          onClick={guardarConfiguracion}
          disabled={saving}
        >
          {saving ? '⏳ Guardando...' : '💾 Guardar Configuración'}
        </button>
        <button 
          className="btn-cancelar-config"
          onClick={cargarConfiguracion}
          disabled={saving}
        >
          🔄 Restablecer
        </button>
      </div>

      {/* Información de Seguridad */}
      <section className="card info-seguridad">
        <h3>ℹ️ Recomendaciones de Seguridad</h3>
        <ul>
          <li><strong>Tiempo de Sesión:</strong> 30-60 minutos es recomendado para balance entre seguridad y usabilidad</li>
          <li><strong>Intentos de Login:</strong> 3-5 intentos previene ataques de fuerza bruta</li>
          <li><strong>Contraseñas:</strong> Mínimo 8 caracteres con mayúsculas, números y símbolos</li>
          <li><strong>2FA:</strong> Altamente recomendado para usuarios administrativos</li>
          <li><strong>Logs:</strong> Mantener activados para auditorías y detección de anomalías</li>
          <li><strong>Backups:</strong> Esencial para recuperación ante desastres</li>
        </ul>
      </section>
    </div>
  );
}

export default Configuracion;
// Login.jsx - INTEGRADO CON BACKEND
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import authService from '../../../services/authService';
import { handleApiError } from '../../../utils/helpers';
import './Login.css';

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      
      // Redirigir según el rol del usuario
      const userRole = response.user.role;
      
      toast.success(`¡Bienvenido ${response.user.first_name || response.user.username}!`);
      
      // Usar window.location para forzar recarga completa y limpiar estado anterior
      let redirectPath = "/inicio";
      
      if (userRole === 'estudiante') {
        redirectPath = "/inicio";
      } else if (userRole === 'jefe') {
        redirectPath = "/jefe/inicio";
      } else if (userRole === 'tutor') {
        redirectPath = "/tutor/inicio";
      } else if (userRole === 'admin') {
        redirectPath = "/admin/inicio";
      }
      
      // Forzar recarga completa del navegador para limpiar estado
      console.log('✅ Login exitoso, recargando con nuevo usuario:', response.user.username);
      window.location.href = redirectPath;
      
    } catch (error) {
      console.error('Error en login:', error);
      // Mostrar mensaje específico si la cuenta está bloqueada temporalmente
      const lockedMinutes = error?.response?.data?.locked_minutes;
      if (lockedMinutes) {
        toast.error(`Cuenta bloqueada temporalmente. Intenta de nuevo en ${lockedMinutes} minuto${lockedMinutes > 1 ? 's' : ''}.`);
      } else {
        // Usar handleApiError para mostrar un único mensaje claro
        handleApiError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="logo-container">
          <img src="\Imagenes\logouci.webp" alt="Logo UCI" />
        </div>
        
        <h1>Bienvenido</h1>
        <p className="subtitle">Sistema de Gestión ECE por Publicaciones</p>
        
        <form onSubmit={handleLogin} className="login-form" autoComplete="off">
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <div className="input-group">
              <input
                type="text"
                className="form-input"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="off"
                name="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-group">
              <input
                type="password"
                className="form-input"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                name="password"
              />
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
          </button>

          <div className="forgot-password-link">
            <button 
              type="button" 
              className="btn-forgot-password" 
              onClick={() => navigate("/forgot-password")} 
              disabled={loading}
            >
              ¿Olvidó su contraseña?
            </button>
          </div>
          
          <p className="small-note">¿No tienes cuenta?</p>
          <button type="button" className="btn-register" onClick={() => navigate("/register")} disabled={loading}>
            📝 Registrarse
          </button>
          

          
        </form>
      </div>
    </div>
  );
}

export default Login;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { handleApiError } from '../../utils/helpers';
import './ForgotPassword.css';

function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(username, email, newPassword);
      toast.success("✅ Contraseña restablecida correctamente. Ahora puedes iniciar sesión.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      handleApiError(error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.response?.data?.username) {
        toast.error(error.response.data.username[0]);
      } else if (error.response?.data?.new_password) {
        const msg = Array.isArray(error.response.data.new_password) 
          ? error.response.data.new_password.join(' ') 
          : error.response.data.new_password;
        toast.error(msg);
      } else {
        toast.error('Error al restablecer la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-password-box">
        <div className="logo-container">
          <img src="\Imagenes\logouci.webp" alt="Logo UCI" />
        </div>
        
        <h1>Recuperar Contraseña</h1>
        <p className="subtitle">Ingresa tu usuario y correo para restablecer tu contraseña</p>
        
        <form onSubmit={handleReset} className="forgot-password-form">
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                className="form-input"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div className="input-group">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                className="form-input"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nueva Contraseña</label>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                className="form-input"
                placeholder="Ingresa tu nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar Nueva Contraseña</label>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                className="form-input"
                placeholder="Confirma tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          <button type="submit" className="btn-reset" disabled={loading}>
            {loading ? '⏳ Restableciendo...' : '🔄 Restablecer Contraseña'}
          </button>
          
          <button 
            type="button" 
            className="btn-back" 
            onClick={() => navigate("/login")} 
            disabled={loading}
          >
            ← Volver al Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;

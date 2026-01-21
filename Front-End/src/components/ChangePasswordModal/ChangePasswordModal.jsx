import { useState } from 'react';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import { handleApiError } from '../../utils/helpers';
import './ChangePasswordModal.css';

function ChangePasswordModal({ isOpen, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(oldPassword, newPassword);
      toast.success('✅ Contraseña actualizada correctamente');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      // Usar handleApiError para mostrar un único mensaje claro
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔒 Cambiar Contraseña</h2>
          <button 
            className="modal-close" 
            onClick={handleClose}
            disabled={loading}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Contraseña Actual</label>
            <input
              type="password"
              className="form-input"
              placeholder="Ingresa tu contraseña actual"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nueva Contraseña</label>
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
            <small className="form-hint">Mínimo 8 caracteres</small>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar Nueva Contraseña</label>
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

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={loading}
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;

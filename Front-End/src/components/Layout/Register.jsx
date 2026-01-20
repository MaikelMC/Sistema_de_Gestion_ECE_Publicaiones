// Register.jsx - INTEGRADO CON BACKEND
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from 'react-toastify';
//import authService from '../../services/authService';
import { handleApiError } from '../../utils/helpers';
import { validators } from '../../utils/validation';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    carrera: "Ciberseguridad",
    especialidad: ""
  });
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validar fuerza de contraseña en tiempo real
    if (name === "password") {
      validatePasswordStrength(value);
    }
  };

  const validatePasswordStrength = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (strongRegex.test(password)) {
      setPasswordStrength("Fuerte 🔒");
    } else if (mediumRegex.test(password)) {
      setPasswordStrength("Media 🟡");
    } else {
      setPasswordStrength("Débil 🔴");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (!formData.email.endsWith("@uci.cu") && !formData.email.endsWith("@estudiantes.uci.cu")) {
      toast.error("Debe usar un correo institucional UCI");
      return;
    }

    // Validar nombres: solo letras, espacios, guiones o apóstrofes
    if (!validators.isAlpha(formData.first_name)) {
      toast.error('El nombre solo debe contener letras y espacios.');
      return;
    }
    if (!validators.isAlpha(formData.last_name)) {
      toast.error('El apellido solo debe contener letras y espacios.');
      return;
    }

    const role = formData.email.endsWith("@uci.cu") ? 'tutor' : 'estudiante';

    setLoading(true);

    try {
      // Preparar datos para el backend
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.confirmPassword,
        first_name: formData.first_name,
        last_name: formData.last_name,
        carrera: formData.carrera,
        especialidad: formData.especialidad,
        role: role
      };

      // Registrar sin auto-login
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      toast.success("¡Registro exitoso! Por favor inicia sesión");
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error('Error en registro:', error);
      handleApiError(error);
      
      // Mostrar errores específicos del backend
      if (error.response?.data) {
        const errors = error.response.data;
        if (errors.username) toast.error(`Usuario: ${errors.username[0]}`);
        if (errors.email) toast.error(`Email: ${errors.email[0]}`);
        // año handled later in profile; backend may return errors if required
        if (errors.password) toast.error(`Contraseña: ${errors.password[0]}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-box">
        <div className="logo-container">
          <img src="\Imagenes\logouci.webp" alt="Logo UCI" />
        </div>
        
        <h1>Crear Cuenta</h1>
        <p className="subtitle">Únete al Sistema de Gestión ECE</p>
        
        <form onSubmit={handleSubmit} className="register-form" autoComplete="off">
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="Crea tu nombre de usuario"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre</label>
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="first_name"
                className="form-input"
                placeholder="Tu nombre"
                value={formData.first_name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Apellidos</label>
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="last_name"
                className="form-input"
                placeholder="Tus apellidos"
                value={formData.last_name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Año eliminado del formulario de registro; los estudiantes deben añadirlo luego en su perfil */}

          <div className="form-group">
            <label className="form-label">Correo UCI</label>
            <div className="input-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="tu.email@estudiantes.uci.cu"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Mín. 8 caracteres, mayúscula, número y especial"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>
            {passwordStrength && (
              <div className={`password-strength ${passwordStrength.includes("Fuerte") ? "strong" : passwordStrength.includes("Media") ? "medium" : "weak"}`}>
                Seguridad: {passwordStrength}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar Contraseña</label>
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? '⏳ Registrando...' : '🚀 Crear Cuenta'}
          </button>

          <div className="login-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
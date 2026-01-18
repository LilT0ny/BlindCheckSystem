import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Key, Mail, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import CambiarPassword from './CambiarPassword';
import RecuperarPassword from './RecuperarPassword';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'estudiante'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCambiarPassword, setShowCambiarPassword] = useState(false);
  const [showRecuperarPassword, setShowRecuperarPassword] = useState(false);
  const [loginData, setLoginData] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar dominio del correo
    if (!formData.email.endsWith('@blindcheck.edu')) {
      setError('El correo debe ser del dominio @blindcheck.edu');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', formData);
      const { access_token, role, user_id, primer_login } = response.data;

      // Guardar datos del login
      setLoginData({ id: user_id, email: formData.email, role, access_token });

      // Si es primer login, mostrar modal de cambio de contraseña
      if (primer_login) {
        // Token está en HttpOnly Cookie - no necesitamos guardarlo
        setShowCambiarPassword(true);
        setLoading(false);
        return;
      }

      // Login normal - guardar token en memoria
      login({ id: user_id, email: formData.email, role }, access_token);

      // Redirigir según el rol
      switch (role) {
        case 'estudiante':
          navigate('/estudiante/dashboard');
          break;
        case 'docente':
          navigate('/docente/dashboard');
          break;
        case 'subdecano':
          navigate('/subdecano/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChanged = () => {
    // Después de cambiar la contraseña, hacer login automáticamente
    if (loginData) {
      login(
        { id: loginData.id, email: loginData.email, role: loginData.role },
        loginData.access_token
      );

      // Redirigir según el rol
      switch (loginData.role) {
        case 'estudiante':
          navigate('/estudiante/dashboard');
          break;
        case 'docente':
          navigate('/docente/dashboard');
          break;
        case 'subdecano':
          navigate('/subdecano/dashboard');
          break;
        default:
          navigate('/');
      }
    }
  };

  return (
    <>
      {showCambiarPassword && (
        <CambiarPassword onPasswordChanged={handlePasswordChanged} />
      )}

      {showRecuperarPassword && (
        <RecuperarPassword
          onClose={() => setShowRecuperarPassword(false)}
          onSuccess={() => setShowRecuperarPassword(false)}
        />
      )}

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Sistema de Recalificación</h1>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="alert alert-error flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="role" className="form-label flex items-center gap-2">
                <User className="w-4 h-4" /> Tipo de Usuario
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
                <option value="subdecano">Subdecano</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label flex items-center gap-2">
                <Mail className="w-4 h-4" /> Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label flex items-center gap-2">
                <Lock className="w-4 h-4" /> Contraseña
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading"></span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" /> Iniciar Sesión
                </>
              )}
            </button>

            <div className="login-links">
              <button
                type="button"
                className="link-button flex items-center justify-center gap-2"
                onClick={() => setShowRecuperarPassword(true)}
              >
                <Key className="w-4 h-4" /> ¿Olvidó su contraseña?
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

    try {
      const response = await api.post('/auth/login', formData);
      const { access_token, role, user_id, primer_login } = response.data;
      
      console.log('🔍 DEBUG LOGIN FRONTEND:');
      console.log('  Response data:', response.data);
      console.log('  primer_login:', primer_login);
      console.log('  Token guardado en HttpOnly Cookie ✅');
      console.log('  tipo de primer_login:', typeof primer_login);
      
      // Guardar datos del login
      setLoginData({ id: user_id, email: formData.email, role, access_token });
      
      // Si es primer login, mostrar modal de cambio de contraseña
      if (primer_login) {
        console.log('  ✅ Mostrando modal de cambio de contraseña');
        // Token está en HttpOnly Cookie - no necesitamos guardarlo
        setShowCambiarPassword(true);
        setLoading(false);
        return;
      }
      
      console.log('  ℹ️ Login normal, redirigiendo...');
      
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
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="role" className="form-label">Tipo de Usuario</label>
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
            <label htmlFor="email" className="form-label">Correo Electrónico</label>
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
            <label htmlFor="password" className="form-label">Contraseña</label>
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
                {showPassword ? "👁️" : "�️‍🗨️"}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>

          <div className="login-links">
            <button
              type="button"
              className="link-button"
              onClick={() => setShowRecuperarPassword(true)}
            >
              🔑 ¿Olvidó su contraseña?
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default Login;

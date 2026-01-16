import React, { useState } from 'react';
import AlertModal from './AlertModal';
import api from '../services/api';
import './CambiarPassword.css';

const CambiarPassword = ({ onPasswordChanged }) => {
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (passwordNueva.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Validar mayúscula
    if (!/[A-Z]/.test(passwordNueva)) {
      setError('La contraseña debe contener al menos una letra mayúscula');
      return;
    }

    // Validar número
    if (!/[0-9]/.test(passwordNueva)) {
      setError('La contraseña debe contener al menos un número');
      return;
    }

    // Validar carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordNueva)) {
      setError('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)');
      return;
    }

    if (passwordNueva !== passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/auth/cambiar-password-forzado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password_nueva: passwordNueva })
      });

      if (!response.ok) {
        throw new Error('Error al cambiar la contraseña');
      }

      setAlert({ show: true, type: 'success', title: '✅ Éxito', message: 'Contraseña actualizada exitosamente' });
      setTimeout(() => onPasswordChanged(), 1500);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cambiar-password-overlay">
      <AlertModal 
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <div className="cambiar-password-modal">
        <div className="cambiar-password-header">
          <h2>🔒 Cambio de Contraseña Obligatorio</h2>
          <p>Es tu primer inicio de sesión. Debes cambiar tu contraseña para continuar.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nueva Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>

          <div className="password-requirements">
            <p><strong>Requisitos:</strong></p>
            <ul>
              <li>Mínimo 8 caracteres</li>
              <li>Al menos una letra mayúscula (A-Z)</li>
              <li>Al menos un número (0-9)</li>
              <li>Al menos un carácter especial (!@#$%...)</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarPassword;

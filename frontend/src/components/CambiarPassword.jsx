import React, { useState } from 'react';
import './CambiarPassword.css';

const CambiarPassword = ({ onPasswordChanged }) => {
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (passwordNueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
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

      alert('✅ Contraseña actualizada exitosamente');
      onPasswordChanged();
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cambiar-password-overlay">
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
              placeholder="Mínimo 6 caracteres"
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
              <li>Mínimo 6 caracteres</li>
              <li>No usar la contraseña temporal</li>
              <li>Fácil de recordar pero difícil de adivinar</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarPassword;

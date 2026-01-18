import React, { useState } from 'react';
import { Lock, CheckCircle, AlertTriangle, Save, RefreshCw } from 'lucide-react';
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
      await api.post('/auth/cambiar-password-forzado', {
        password_nueva: passwordNueva
      });

      setAlert({ show: true, type: 'success', title: 'Éxito', message: 'Contraseña actualizada exitosamente' });
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
          <h2 className="flex items-center gap-2">
            <Lock className="w-6 h-6" /> Cambio de Contraseña Obligatorio
          </h2>
          <p>Es tu primer inicio de sesión. Debes cambiar tu contraseña para continuar.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> Nueva Contraseña
            </label>
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
            <label className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> Confirmar Contraseña
            </label>
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
            <div className="error-message flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Actualizando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Cambiar Contraseña
              </>
            )}
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

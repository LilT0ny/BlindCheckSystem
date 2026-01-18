import React, { useState } from 'react';
import { Key, Mail, CheckCircle, AlertTriangle, XCircle, FileText, Send } from 'lucide-react';
import AlertModal from './AlertModal';
import api from '../services/api';
import './RecuperarPassword.css';

const RecuperarPassword = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'info', title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setAlert({ show: true, type: 'warning', title: 'Aviso', message: 'Debes ingresar tu email' });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/solicitar-reset-password', { email });

      setAlert({
        show: true,
        type: 'success',
        title: 'Solicitud Enviada',
        message: response.data.message
      });

      setTimeout(() => {
        setEmail('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setAlert({
        show: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.detail || 'Error al enviar la solicitud'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recuperar-overlay">
      <AlertModal
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
      />
      <div className="recuperar-modal">
        <div className="recuperar-header">
          <h2 className="flex items-center gap-2">
            <Key className="w-6 h-6" /> Recuperar Contraseña
          </h2>
          <p>Ingresa tu email y contacta al subdecano para obtener una nueva contraseña.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email Registrado
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.email@blindcheck.edu"
              required
              autoFocus
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={loading}
            >
              {loading ? 'Enviando...' : <><Send className="w-4 h-4" /> Solicitar Reset</>}
            </button>
          </div>

          <div className="info-box">
            <p className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> <strong>Instrucciones:</strong>
            </p>
            <ul>
              <li>Enviaremos una solicitud al subdecano</li>
              <li>El subdecano generará una contraseña temporal</li>
              <li>Te contactarán para brindarte la nueva contraseña</li>
              <li>Deberás cambiarla en el primer login</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecuperarPassword;

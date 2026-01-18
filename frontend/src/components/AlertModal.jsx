import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './AlertModal.css';

const AlertModal = ({ show, type, title, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="alert-overlay">
      <div className={`alert-modal alert-${type}`}>
        <div className="alert-header">
          <div className="alert-icon">
            {type === 'success' && <CheckCircle className="w-6 h-6 text-success" />}
            {type === 'error' && <XCircle className="w-6 h-6 text-error" />}
            {type === 'warning' && <AlertTriangle className="w-6 h-6 text-warning" />}
            {type === 'info' && <Info className="w-6 h-6 text-info" />}
          </div>
          <h3 className="alert-title">{title}</h3>
          <button className="alert-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="alert-body">
          <p>{message}</p>
        </div>
        <div className="alert-footer">
          <button className={`btn btn-${type}`} onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

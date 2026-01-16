import React from 'react';
import './AlertModal.css';

const AlertModal = ({ show, type, title, message, onClose }) => {
  if (!show) return null;

  return (
    <div className="alert-overlay">
      <div className={`alert-modal alert-${type}`}>
        <div className="alert-header">
          <div className="alert-icon">
            {type === 'success' && '✅'}
            {type === 'error' && '❌'}
            {type === 'warning' && '⚠️'}
            {type === 'info' && 'ℹ️'}
          </div>
          <h3 className="alert-title">{title}</h3>
          <button className="alert-close" onClick={onClose}>✖</button>
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

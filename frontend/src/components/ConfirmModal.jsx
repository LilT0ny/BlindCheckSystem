import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', type = 'warning' }) => {
  if (!show) return null;

  return (
    <div className="confirm-overlay">
      <div className={`confirm-modal confirm-${type}`}>
        <div className="confirm-header">
          <div className="confirm-icon">
            {type === 'warning' && '⚠️'}
            {type === 'danger' && '❌'}
            {type === 'info' && 'ℹ️'}
          </div>
          <h3 className="confirm-title">{title}</h3>
        </div>
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        <div className="confirm-footer">
          <button className="btn btn-outline" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn btn-${type === 'danger' ? 'error' : 'warning'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

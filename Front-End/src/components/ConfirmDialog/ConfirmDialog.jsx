import React from 'react';
import './ConfirmDialog.css';

export default function ConfirmDialog({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', onClose }) {
  return (
    <div className="confirm-overlay" onClick={() => onClose(false)}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {title && <div className="confirm-header"><h3>{title}</h3></div>}
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={() => onClose(false)}>{cancelText}</button>
          <button className="btn-confirm" onClick={() => onClose(true)}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

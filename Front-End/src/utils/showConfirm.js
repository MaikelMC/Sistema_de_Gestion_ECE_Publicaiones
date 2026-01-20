import React from 'react';
import { createRoot } from 'react-dom/client';
import ConfirmDialog from '../components/ConfirmDialog/ConfirmDialog';

export default function showConfirm({ title = '', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar' } = {}) {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleClose = (result) => {
      resolve(result);
      setTimeout(() => {
        try { root.unmount(); } catch (e) {}
        if (container.parentNode) container.parentNode.removeChild(container);
      }, 0);
    };

    root.render(
      React.createElement(ConfirmDialog, {
        title: title,
        message: message,
        confirmText: confirmText,
        cancelText: cancelText,
        onClose: handleClose
      })
    );
  });
}

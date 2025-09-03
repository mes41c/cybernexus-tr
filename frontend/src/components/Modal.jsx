// frontend/src/components/Modal.jsx

import React from 'react';
import './Modal.css'; // Bir sonraki adımda oluşturacağız

function Modal({ children, onClose, title, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {/* YENİ: Eğer footer prop'u varsa, onu burada render et */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
import React from "react";
import { AlertCircle, X } from "lucide-react";

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: "400px" }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: "var(--accent-danger)" }}>
            <AlertCircle size={18} />
            {title}
          </h3>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: "0.95rem", lineHeight: "1.5", color: "var(--text-primary)" }}>
            {message}
          </p>
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

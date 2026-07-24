import React from "react";
import { Plus, X, Edit3 } from "lucide-react";
import { getHeaderRoles } from "../utils/helpers";

export function AddProductModal({ 
  show, 
  onClose, 
  storeHeaders, 
  formData, 
  onFormChange, 
  isAutocompleted, 
  onSubmit 
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">
            <Plus size={18} color="var(--accent-primary)" />
            Añadir Producto Manualmente
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {storeHeaders.map((header, idx) => {
                const roles = getHeaderRoles(storeHeaders);
                const isCodeField = header === roles.code;
                const isQuantityField = header === roles.quantity;
                const isStoreField = header === roles.store;
                
                const isReadOnly = isAutocompleted && !isCodeField && !isQuantityField && !isStoreField;

                return (
                  <div key={idx} className="form-group">
                    <label className="form-label">{header}</label>
                    <input 
                      type="text" 
                      className={`form-input ${isReadOnly ? 'form-input-readonly' : ''}`}
                      placeholder={isReadOnly ? "Autocompletado (Solo lectura)" : `Ingresar ${header}`}
                      value={formData[header] || ""}
                      onChange={(e) => onFormChange(header, e.target.value)}
                      readOnly={isReadOnly}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Agregar / Acumular Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditProductModal({ 
  show, 
  onClose, 
  storeHeaders, 
  formData, 
  onFormChange, 
  onSubmit 
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">
            <Edit3 size={18} color="var(--accent-primary)" />
            Editar Producto
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {storeHeaders.map((header, idx) => (
                <div key={idx} className="form-group">
                  <label className="form-label">{header}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData[header] || ""}
                    onChange={(e) => onFormChange(header, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SellerEditPriceModal({ 
  show, 
  onClose, 
  sellerEditRow, 
  sellerEditPrice, 
  setSellerEditPrice, 
  onSubmit, 
  storeHeaders 
}) {
  if (!show) return null;

  const roles = getHeaderRoles(storeHeaders);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "450px" }}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Edit3 size={18} color="var(--accent-primary)" />
            Editar Precio de Venta
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "rgba(0,0,0,0.02)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Producto</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{sellerEditRow?.data[roles.description] || "Sin descripción"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>Código: {sellerEditRow?.data[roles.code] || "N/A"}</div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Nuevo Precio de Venta</label>
                <input 
                  type="number" 
                  step="any"
                  className="form-input" 
                  value={sellerEditPrice}
                  onChange={(e) => setSellerEditPrice(e.target.value)}
                  placeholder="Ingrese el nuevo precio de venta"
                  required
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Precio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

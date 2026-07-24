import React from "react";
import { X, Printer, CheckCircle } from "lucide-react";

function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  // Cálculos de impuestos locales (ej: IGV 18%)
  const total = receipt.total || 0;
  const gravada = total / 1.18;
  const igv = total - gravada;

  return (
    <div className="modal-overlay receipt-modal-overlay">
      <div className="modal-content receipt-modal-content">
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: "var(--accent-success)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle size={18} />
            ¡Venta Registrada Exitosamente!
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body receipt-modal-body">
          {/* Área de Impresión del Ticket */}
          <div id="receipt-print-area" className="receipt-ticket">
            <div className="receipt-header">
              <h2 className="receipt-brand">CLANDBUS</h2>
              <p className="receipt-subbrand">Soluciones de Inventario</p>
              <div className="receipt-dashed-divider"></div>
              <h3 className="receipt-title">NOTA DE VENTA ELECTRÓNICA</h3>
              <p className="receipt-number">{receipt.boletaNumber}</p>
              <div className="receipt-dashed-divider"></div>
            </div>

            <div className="receipt-details">
              <div className="receipt-detail-row">
                <span>Fecha:</span>
                <span>{receipt.dateTime}</span>
              </div>
              <div className="receipt-detail-row">
                <span>Establecimiento:</span>
                <span>{receipt.storeName || "Matriz"}</span>
              </div>
              <div className="receipt-detail-row">
                <span>Cliente:</span>
                <span>{receipt.clientName || "Consumidor Final"}</span>
              </div>
              <div className="receipt-detail-row">
                <span>Vendedor:</span>
                <span style={{ textTransform: "capitalize" }}>{receipt.sellerName}</span>
              </div>
            </div>

            <div className="receipt-dashed-divider"></div>

            {/* Tabla de Artículos */}
            <table className="receipt-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Descripción</th>
                  <th style={{ textAlign: "center" }}>Cant.</th>
                  <th style={{ textAlign: "right" }}>P. Unit.</th>
                  <th style={{ textAlign: "right" }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: "left" }}>
                      {item.description || "Producto"}
                      <div className="receipt-item-code">Cód: {item.code || "N/A"}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>${item.customPrice.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${(item.quantity * item.customPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="receipt-dashed-divider"></div>

            {/* Bloque de Totales */}
            <div className="receipt-totals">
              <div className="receipt-total-row">
                <span>Op. Gravada:</span>
                <span>${gravada.toFixed(2)}</span>
              </div>
              <div className="receipt-total-row">
                <span>I.G.V. (18%):</span>
                <span>${igv.toFixed(2)}</span>
              </div>
              <div className="receipt-total-row total-amount-row">
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-dashed-divider"></div>

            <div className="receipt-footer">
              <p>¡Gracias por su preferencia!</p>
              <p style={{ fontSize: "7px", marginTop: "0.25rem", color: "#666" }}>
                Representación impresa de la Nota de Venta Electrónica.
              </p>
              {/* Código de barras visual mock mediante SVG */}
              <div className="receipt-barcode-mock">
                <svg width="150" height="35" viewBox="0 0 150 35">
                  <rect x="0" y="0" width="150" height="35" fill="none" />
                  <path d="M5 5h2v25H5zm4 0h3v25H9zm5 0h1v25h-1zm3 0h2v25h-2zm6 0h4v25h-4zm5 0h1v25h-1zm3 0h3v25h-3zm8 0h2v25h-2zm4 0h1v25h-1zm2 0h3v25h-3zm7 0h2v25h-2zm6 0h4v25H121zm5 0h1v25H126zm3 0h3v25H129zm8 0h2v25H134zm4 0h1v25H139zm2 0h3v25H142zm2 0h1v25H145" fill="#000" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer receipt-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            Imprimir Nota
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReceiptModal;

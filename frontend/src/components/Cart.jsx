import React from "react";
import { ShoppingCart, X } from "lucide-react";

function Cart({
  cart,
  clientName,
  setClientName,
  updateCartQty,
  updateCartPrice,
  removeFromCart,
  clearCart,
  confirmSale,
  loadingDetails
}) {
  return (
    <div className="glass-card" style={{ height: "fit-content" }}>
      <h2 className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShoppingCart size={20} className="logo-icon" />
          Caja de Compras
        </span>
        {cart.length > 0 && (
          <span className="cart-badge" style={{ background: "var(--accent-success)", color: "#fff", fontSize: "0.75rem", padding: "0.15rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>
            {cart.length}
          </span>
        )}
      </h2>
      
      <div className="form-group" style={{ marginBottom: "1rem" }}>
        <label className="form-label">Nombre del Cliente</label>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Ej. Cliente General..."
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart" style={{ textAlign: "center", padding: "2rem 1rem", border: "1px dashed var(--border-color)", borderRadius: "var(--radius-lg)" }}>
          <p className="empty-cart-text" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>La caja está vacía</p>
          <p className="empty-cart-subtext" style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>Busca productos y agrégalos usando el botón (+).</p>
        </div>
      ) : (
        <div className="cart-items-container" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="cart-list" style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.25rem" }}>
            {cart.map((item) => (
              <div key={item.rowId} className="cart-item" style={{ background: "rgba(0,0,0,0.01)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="cart-item-name" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.description || "Sin descripción"}</span>
                    <span className="cart-item-code" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Código: {item.code || "S/C"}</span>
                  </div>
                  <button 
                    type="button" 
                    className="row-action-btn delete"
                    onClick={() => removeFromCart(item.rowId)}
                    style={{ padding: "0.25rem", minWidth: "auto", height: "auto" }}
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", justifyContent: "space-between", marginTop: "0.25rem" }}>
                  {/* Cantidad */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => updateCartQty(item.rowId, item.quantity - 1)}
                      disabled={item.quantity <= 0.1}
                      style={{ padding: "0.25rem 0.5rem", minWidth: "auto", height: "24px" }}
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      step="any"
                      className="form-input"
                      value={item.quantity}
                      onChange={(e) => updateCartQty(item.rowId, parseFloat(e.target.value) || 0)}
                      style={{ width: "55px", height: "24px", padding: "0 0.25rem", textAlign: "center", fontSize: "0.85rem" }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => updateCartQty(item.rowId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                      style={{ padding: "0.25rem 0.5rem", minWidth: "auto", height: "24px" }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "0.25rem" }}>{item.unit || "und"}</span>
                  </div>

                  {/* Precio Editable */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>$:</span>
                    <input 
                      type="number"
                      step="any"
                      className="form-input"
                      value={item.customPrice}
                      onChange={(e) => updateCartPrice(item.rowId, parseFloat(e.target.value) || 0)}
                      style={{ width: "70px", height: "24px", padding: "0 0.25rem", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(0,0,0,0.04)", paddingTop: "0.4rem", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Stock disp: {item.maxQuantity} {item.unit}</span>
                  <span style={{ fontWeight: 600, color: "var(--accent-success)" }}>
                    Subtotal: ${(item.quantity * item.customPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div className="summary-line" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <span>Artículos:</span>
              <span>{cart.reduce((sum, item) => sum + item.quantity, 0).toFixed(1)}</span>
            </div>
            <div className="summary-line total-line" style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", borderTop: "1px dashed rgba(0,0,0,0.06)", paddingTop: "0.4rem" }}>
              <span>Total:</span>
              <span style={{ color: "var(--accent-success)" }}>${cart.reduce((sum, item) => sum + (item.quantity * item.customPrice), 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="cart-actions" style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={clearCart}
              style={{ flex: 1, padding: "0.5rem 0.75rem" }}
            >
              Limpiar
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={confirmSale}
              style={{ flex: 2, padding: "0.5rem 0.75rem" }}
              disabled={loadingDetails}
            >
              Registrar Venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;

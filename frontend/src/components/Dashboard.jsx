import React from "react";
import { Plus, ShoppingBag, Store, Download, Trash2 } from "lucide-react";

function Dashboard({
  role,
  newStoreName,
  setNewStoreName,
  handleCreateStore,
  loading,
  stores,
  fetchStoreDetails,
  handleDeleteStore,
  apiBase
}) {
  return (
    <div className="dashboard-grid">
      
      {/* Columna Izquierda: Crear Tienda (Propietario) o Info (Vendedor) */}
      {role === "propietario" ? (
        <div className="glass-card">
          <h2 className="card-title">
            <Plus size={20} className="logo-icon" />
            Registrar Tienda
          </h2>
          <form onSubmit={handleCreateStore} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p className="upload-text-secondary" style={{ marginBottom: "0.5rem" }}>
              Crea una nueva tienda para gestionar sus inventarios. Después de registrarla, podrás cargarle múltiples archivos Excel y añadir productos manualmente.
            </p>
            <div className="form-group">
              <label className="form-label">Nombre de la Tienda</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej. Sucursal Norte, Tienda Centro..."
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              <Plus size={16} />
              <span>Crear Tienda</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 className="card-title">
            <ShoppingBag size={20} className="logo-icon" />
            Portal de Ventas
          </h2>
          <p className="upload-text-secondary" style={{ lineHeight: "1.6" }}>
            Bienvenido al portal de vendedores. Selecciona una de las tiendas de la lista a la derecha para comenzar a vender.
          </p>
          <div style={{ padding: "1rem", background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.15)", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
            <strong style={{ color: "var(--accent-primary)", display: "block", marginBottom: "0.25rem" }}>Instrucciones rápidas:</strong>
            <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem", color: "var(--text-secondary)" }}>
              <li>Selecciona la tienda correspondiente.</li>
              <li>Busca los productos por su código o nombre.</li>
              <li>Añade productos a la caja de compras.</li>
              <li>Registra la venta para descontar stock automáticamente.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Columna Derecha: Lista de Tiendas */}
      <div className="glass-card">
        <h2 className="card-title">
          <ShoppingBag size={20} className="logo-icon" />
          Tiendas Registradas
        </h2>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span className="loading-text">Cargando tiendas...</span>
          </div>
        ) : stores.length === 0 ? (
          <div className="empty-state">
            <Store size={48} className="empty-state-icon" />
            <p className="empty-state-title">No hay tiendas registradas</p>
            <p className="empty-state-desc">Registra una tienda a la izquierda para empezar a gestionar inventarios.</p>
          </div>
        ) : (
          <div className="sheet-list">
            {stores.map(store => (
              <div 
                key={store.id} 
                className="sheet-item"
                style={{ cursor: "pointer" }}
                onClick={() => fetchStoreDetails(store.id)}
              >
                <div className="sheet-info-col">
                  <span className="sheet-name" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Store size={16} color="var(--accent-primary)" />
                    {store.name}
                  </span>
                  <div className="sheet-meta">
                    <span>{store.row_count} Productos Consolidados</span>
                    <span className="meta-divider">•</span>
                    <span>Modificado: {new Date(store.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {role === "propietario" && (
                  <div className="sheet-actions">
                    <button 
                      className="btn btn-secondary btn-icon-only"
                      title="Exportar Inventario Consolidado"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `${apiBase}/stores/${store.id}/export`;
                      }}
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      className="btn btn-danger btn-icon-only"
                      title="Eliminar Tienda"
                      onClick={(e) => handleDeleteStore(store.id, store.name, e)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;

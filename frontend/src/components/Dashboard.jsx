import React from "react";
import { Plus, ShoppingBag, Store, Download, Trash2 } from "lucide-react";

function Dashboard({
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
      
      {/* Columna Izquierda: Registrar Tienda */}
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
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;


import React from "react";
import { Search, Plus, Edit3, Trash2 } from "lucide-react";
import { getHeaderRoles } from "../utils/helpers";

function ProductTable({
  storeDetails,
  filteredRows,
  role,
  searchTerm,
  setSearchTerm,
  loadingDetails,
  openEditModal,
  handleDeleteRow,
  openSellerEditModal,
  addToCart
}) {
  return (
    <div className="glass-card" style={{ padding: "1.5rem" }}>
      {/* Barra de control: Buscador e Info de Filas */}
      <div className="control-bar" style={{ marginTop: 0 }}>
        <div className="search-container">
          <Search className="search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Buscar producto en esta tienda..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="row-count">
          Mostrando <strong>{filteredRows.length}</strong> de <strong>{storeDetails.rows.length}</strong> productos
        </div>
      </div>

      {/* Tabla de Datos */}
      {loadingDetails ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <span className="loading-text">Consolidando productos de la tienda...</span>
        </div>
      ) : storeDetails.rows.length === 0 ? (
        <div className="empty-state">
          <Plus size={48} className="empty-state-icon" />
          <p className="empty-state-title">Esta tienda no tiene productos</p>
          <p className="empty-state-desc">
            {role === "propietario" 
              ? 'Sube un Excel en la sección izquierda o haz clic en "Añadir Producto" para empezar.'
              : 'No hay productos disponibles en esta tienda.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {storeDetails.info?.headers
                  .filter(header => role === "propietario" || header !== getHeaderRoles(storeDetails.info.headers).price)
                  .map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))
                }
                <th className="row-actions-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const roles = getHeaderRoles(storeDetails.info?.headers);
                return (
                  <tr key={row.id}>
                    {storeDetails.info?.headers
                      .filter(header => role === "propietario" || header !== roles.price)
                      .map((header, idx) => (
                        <td key={idx} title={row.data[header]}>
                          {row.data[header] !== null ? String(row.data[header]) : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>vacío</span>}
                        </td>
                      ))
                    }
                    <td className="row-actions-cell">
                      <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }}>
                        {role === "propietario" ? (
                          <>
                            <button 
                              className="row-action-btn edit" 
                              title="Editar Producto"
                              onClick={() => openEditModal(row)}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button 
                              className="row-action-btn delete" 
                              title="Eliminar Producto"
                              onClick={() => handleDeleteRow(row.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="row-action-btn edit" 
                              title="Editar Precio de Venta"
                              onClick={() => openSellerEditModal(row)}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button 
                              className="row-action-btn-add" 
                              title="Añadir a la Caja"
                              onClick={() => addToCart(row)}
                            >
                              <Plus size={22} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProductTable;

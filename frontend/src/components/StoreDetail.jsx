import React from "react";
import { ArrowLeft, Store, FileDown, Plus, Trash2, Upload } from "lucide-react";
import Cart from "./Cart";
import ProductTable from "./ProductTable";

function StoreDetail({
  storeDetails,
  role,
  onBackClick,
  handleExport,
  setShowAddModal,
  handleDeleteStore,
  dragActive,
  handleDrag,
  handleDrop,
  fileInputRef,
  handleFileChange,
  hideBackButton,
  // Cart props
  cart,
  clientName,
  setClientName,
  updateCartQty,
  updateCartPrice,
  removeFromCart,
  clearCart,
  confirmSale,
  // ProductTable props
  filteredRows,
  searchTerm,
  setSearchTerm,
  loadingDetails,
  openEditModal,
  handleDeleteRow,
  openSellerEditModal,
  addToCart
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Cabecera de la Tienda */}
      {role === "propietario" ? (
        <div className="glass-card store-header-card" style={{ padding: "1.5rem" }}>
          <div className="editor-header" style={{ marginBottom: 0 }}>
            <div className="editor-title-row">
              <button className="back-btn" onClick={onBackClick}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 className="editor-name" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Store size={24} color="var(--accent-primary)" />
                  {storeDetails.info?.name}
                </h2>
                <span className="upload-text-secondary store-uuid-text">UUID: {storeDetails.info?.id}</span>
              </div>
            </div>
            
            <div className="editor-actions">
              <button className="btn btn-secondary" onClick={handleExport}>
                <FileDown size={16} />
                <span>Exportar Excel</span>
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                <span>Añadir Producto</span>
              </button>
              <button className="btn btn-danger" onClick={() => handleDeleteStore(storeDetails.info.id, storeDetails.info.name)}>
                <Trash2 size={16} />
                <span>Eliminar Tienda</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        !hideBackButton && (
          <div className="vendedor-store-header">
            <button className="back-btn" onClick={onBackClick}>
              <ArrowLeft size={18} />
            </button>
            <h2 className="vendedor-store-name">
              <Store size={20} color="var(--accent-primary)" />
              {storeDetails.info?.name}
            </h2>
          </div>
        )
      )}

      <div className="dashboard-grid">
        
        {/* Columna Izquierda: Subida de Excel (Propietario) o Caja de Compras (Vendedor) */}
        {role === "propietario" ? (
          <div className="glass-card" style={{ height: "fit-content" }}>
            <h2 className="card-title">
              <Upload size={20} className="logo-icon" />
              Cargar Excel de Inventario
            </h2>
            <p className="upload-text-secondary" style={{ marginBottom: "1rem" }}>
              Sube un archivo de Excel para sumar y acumular su inventario en esta tienda. Las cantidades de los productos con el mismo código se acumularán automáticamente.
            </p>
            <div 
              className={`upload-dropzone ${dragActive ? "drag-active" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              style={{ padding: "2rem 1rem" }}
            >
              <div className="upload-icon-container" style={{ width: "3rem", height: "3rem" }}>
                <Upload size={24} />
              </div>
              <div>
                <p className="upload-text-primary" style={{ fontSize: "0.9rem" }}>Arrastra tu excel aquí</p>
                <p className="upload-text-secondary">o haz clic para explorar</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="file-input"
                onChange={handleFileChange}
                accept=".xlsx, .xls"
              />
            </div>
          </div>
        ) : (
          <Cart
            cart={cart}
            clientName={clientName}
            setClientName={setClientName}
            updateCartQty={updateCartQty}
            updateCartPrice={updateCartPrice}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            confirmSale={confirmSale}
            loadingDetails={loadingDetails}
          />
        )}

        {/* Columna Derecha: Tabla de Productos */}
        <ProductTable
          storeDetails={storeDetails}
          filteredRows={filteredRows}
          role={role}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          loadingDetails={loadingDetails}
          openEditModal={openEditModal}
          handleDeleteRow={handleDeleteRow}
          openSellerEditModal={openSellerEditModal}
          addToCart={addToCart}
        />

      </div>
    </div>
  );
}

export default StoreDetail;

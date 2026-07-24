import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

// Importar componentes modulares
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import StoreDetail from "./components/StoreDetail";
import DashboardStats from "./components/DashboardStats";
import SalesHistory from "./components/SalesHistory";
import ConfirmDialog from "./components/ConfirmDialog";
import ReceiptModal from "./components/ReceiptModal";
import { AddProductModal, EditProductModal, SellerEditPriceModal } from "./components/Modals";
import UsersManagement from "./components/UsersManagement";

// Importar utilidades
import { 
  getHeaderRoles, 
  parseQuantity, 
  parseUnit, 
  cleanValue 
} from "./utils/helpers";

// Configuración dinámica de la URL del Backend para Render y desarrollo local
const getApiBase = () => {
  let envVal = import.meta.env.VITE_API_BASE;
  if (!envVal) return "http://localhost:8000/api";
  
  // Si no empieza con http:// o https:// ni con /, le agregamos https://
  // Render provee el host sin protocolo (ej: excel-store-sync-backend.onrender.com)
  if (!envVal.startsWith("http://") && !envVal.startsWith("https://") && !envVal.startsWith("/")) {
    envVal = "https://" + envVal;
  }
  
  if (envVal.endsWith("/api") || envVal.endsWith("/api/")) {
    return envVal;
  }
  return envVal.replace(/\/$/, "") + "/api";
};

const API_BASE = getApiBase();

function App() {
  // Estados principales
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeDetails, setStoreDetails] = useState({ info: null, rows: [] });
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Estado del usuario actual logueado y rol
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser).role : "";
  });

  // Estado de navegación lateral corporativa
  const [activeSection, setActiveSection] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return user.role === "propietario" ? "dashboard" : "stores";
    }
    return "dashboard";
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [saleReceipt, setSaleReceipt] = useState(null);

  // Estados del Dashboard estadístico
  const [dashboardStats, setDashboardStats] = useState({
    total_sales: 0,
    total_profit: 0,
    avg_margin: 0,
    low_stock_count: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Estado del carrito (caja de compras)
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("shoppingCart");
    return saved ? JSON.parse(saved) : [];
  });
  const [clientName, setClientName] = useState("Consumidor Final");

  // Estado para modal de editar precio venta de vendedor
  const [showSellerEditModal, setShowSellerEditModal] = useState(false);
  const [sellerEditRow, setSellerEditRow] = useState(null);
  const [sellerEditPrice, setSellerEditPrice] = useState("");

  // Estado de creación de tienda
  const [newStoreName, setNewStoreName] = useState("");

  // Buscador y filtros
  const [searchTerm, setSearchTerm] = useState("");
  
  // Drag & Drop
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRow, setCurrentRow] = useState(null); // Fila activa para editar
  const [formData, setFormData] = useState({}); // Datos del formulario dinámico
  const [isAutocompleted, setIsAutocompleted] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  });

  // Guardar carrito en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem("shoppingCart", JSON.stringify(cart));
  }, [cart]);

  // Cargar datos según sección y sesión activa
  useEffect(() => {
    if (currentUser) {
      if (activeSection === "dashboard") {
        fetchDashboardData();
      } else if (activeSection === "stores" || activeSection === "finanzas") {
        fetchStores();
      }
    }
  }, [currentUser, activeSection]);

  // Monitorear el código para autocompletado en el modal de agregar fila
  useEffect(() => {
    if (!showAddModal) {
      setIsAutocompleted(false);
      return;
    }
    const roles = getHeaderRoles(storeDetails.info?.headers);
    if (!roles.code) return;

    const codeValue = formData[roles.code];
    if (!codeValue || String(codeValue).trim() === "") {
      // Limpiar campos autocompletados
      setFormData(prev => {
        const updated = { ...prev };
        if (roles.description) updated[roles.description] = "";
        if (roles.price) updated[roles.price] = "";
        if (roles.sale) updated[roles.sale] = "";
        return updated;
      });
      setIsAutocompleted(false);
      return;
    }

    // Buscar coincidencia en la tienda actual
    const match = storeDetails.rows.find(row => 
      String(row.data[roles.code] || "").trim().toLowerCase() === String(codeValue).trim().toLowerCase()
    );

    if (match) {
      setFormData(prev => {
        const updated = { ...prev };
        if (roles.description && roles.description in match.data) {
          updated[roles.description] = match.data[roles.description] !== null ? match.data[roles.description] : "";
        }
        if (roles.price && roles.price in match.data) {
          updated[roles.price] = match.data[roles.price] !== null ? match.data[roles.price] : "";
        }
        if (roles.sale && roles.sale in match.data) {
          updated[roles.sale] = match.data[roles.sale] !== null ? match.data[roles.sale] : "";
        }
        return updated;
      });
      setIsAutocompleted(true);
    } else {
      setIsAutocompleted(false);
    }
  }, [formData[storeDetails.info?.headers ? getHeaderRoles(storeDetails.info.headers).code : ''], showAddModal, storeDetails.rows, storeDetails.info?.headers]);

  const showNotification = (type, msg) => {
    if (type === "success") {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(""), 5000);
    }
  };

  const fetchDashboardData = async () => {
    setLoadingStats(true);
    try {
      const statsRes = await fetch(`${API_BASE}/dashboard/stats`);
      const topProductsRes = await fetch(`${API_BASE}/dashboard/top-products`);
      const chartRes = await fetch(`${API_BASE}/dashboard/chart`);

      if (statsRes.ok && topProductsRes.ok && chartRes.ok) {
        const statsData = await statsRes.json();
        const topProductsData = await topProductsRes.json();
        const chartDataPoints = await chartRes.json();

        setDashboardStats(statsData);
        setTopProducts(topProductsData);
        setChartData(chartDataPoints);
      }
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (role === "vendedor" && currentUser?.store_id) {
        params.append("role", "vendedor");
        params.append("store_id", currentUser.store_id);
      }
      const response = await fetch(`${API_BASE}/stores?${params.toString()}`);
      if (!response.ok) throw new Error("No se pudo obtener la lista de tiendas.");
      const data = await response.json();
      setStores(data);
      
      // Si el rol es "vendedor", cargar de frente los detalles de su tienda asignada o la primera disponible
      if (role === "vendedor" && data.length > 0) {
        const storeIdToLoad = currentUser?.store_id || data[0].id;
        fetchStoreDetails(storeIdToLoad);
      }
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`${API_BASE}/stores/${id}`);
      if (!response.ok) throw new Error("No se pudo cargar la información de la tienda.");
      const data = await response.json();
      setStoreDetails(data);
      setSelectedStore(id);
      setSearchTerm("");
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      showNotification("error", "El nombre de la tienda no puede estar vacío.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStoreName }),
      });
      if (!response.ok) throw new Error("Error al crear la tienda.");
      const data = await response.json();
      showNotification("success", `¡Tienda "${data.name}" creada correctamente!`);
      setNewStoreName("");
      fetchStores();
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = (id, name, e) => {
    if (e) e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Tienda",
      message: `¿Estás seguro de que deseas eliminar la tienda "${name}" y todos sus productos acumulados? Esta acción es irreversible.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE}/stores/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Error al eliminar la tienda.");
          
          showNotification("success", "Tienda eliminada correctamente.");
          if (selectedStore === id) {
            setSelectedStore(null);
          }
          fetchStores();
        } catch (err) {
          showNotification("error", err.message);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    const extension = file.name.split(".").pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !["xlsx", "xls"].includes(extension)) {
      showNotification("error", "Por favor, sube solo archivos de Excel (.xlsx o .xls)");
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    setLoadingDetails(true);
    try {
      const response = await fetch(`${API_BASE}/stores/${selectedStore}/upload`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al subir el archivo.");
      }

      const updatedDetails = await response.json();
      showNotification("success", `¡Excel cargado y acumulado con éxito en "${updatedDetails.info.name}"!`);
      setStoreDetails(updatedDetails);
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddRow = async (e) => {
    e.preventDefault();
    
    // Preparar objeto de datos limpio
    const cleanedData = {};
    storeDetails.info.headers.forEach(h => {
      cleanedData[h] = cleanValue(formData[h]);
    });

    try {
      const response = await fetch(`${API_BASE}/stores/${selectedStore}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: cleanedData }),
      });

      if (!response.ok) throw new Error("No se pudo procesar el producto.");
      
      const savedRow = await response.json();
      
      setStoreDetails(prev => {
        const existingIdx = prev.rows.findIndex(r => r.id === savedRow.id);
        if (existingIdx !== -1) {
          const updatedRows = [...prev.rows];
          updatedRows[existingIdx] = savedRow;
          return { ...prev, rows: updatedRows };
        } else {
          return { ...prev, rows: [...prev.rows, savedRow] };
        }
      });
      
      setShowAddModal(false);
      setFormData({});
      showNotification("success", "Producto procesado correctamente.");
    } catch (err) {
      showNotification("error", err.message);
    }
  };

  const openEditModal = (row) => {
    setCurrentRow(row);
    
    // Inicializar el formulario con los datos existentes
    const initialFormData = {};
    storeDetails.info.headers.forEach(h => {
      initialFormData[h] = row.data[h] !== null ? row.data[h] : "";
    });
    
    setFormData(initialFormData);
    setShowEditModal(true);
  };

  const handleEditRow = async (e) => {
    e.preventDefault();

    const cleanedData = {};
    storeDetails.info.headers.forEach(h => {
      cleanedData[h] = cleanValue(formData[h]);
    });

    try {
      const response = await fetch(`${API_BASE}/stores/${selectedStore}/rows/${currentRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: cleanedData }),
      });

      if (!response.ok) throw new Error("No se pudo actualizar el producto.");
      
      const updatedRow = await response.json();
      
      setStoreDetails(prev => ({
        ...prev,
        rows: prev.rows.map(r => r.id === currentRow.id ? updatedRow : r)
      }));
      
      setShowEditModal(false);
      setCurrentRow(null);
      setFormData({});
      showNotification("success", "Producto actualizado correctamente.");
    } catch (err) {
      showNotification("error", err.message);
    }
  };

  const handleDeleteRow = (rowId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Producto",
      message: "¿Deseas eliminar este producto del inventario consolidado?",
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_BASE}/stores/${selectedStore}/rows/${rowId}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Error al eliminar el producto.");
          
          setStoreDetails(prev => ({
            ...prev,
            rows: prev.rows.filter(r => r.id !== rowId)
          }));
          
          showNotification("success", "Producto eliminado correctamente.");
        } catch (err) {
          showNotification("error", err.message);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleExport = () => {
    if (!selectedStore) return;
    window.location.href = `${API_BASE}/stores/${selectedStore}/export`;
  };

  const handleFormChange = (header, value) => {
    setFormData(prev => ({
      ...prev,
      [header]: value
    }));
  };

  // Funciones de Carrito
  const addToCart = (row) => {
    const roles = getHeaderRoles(storeDetails.info?.headers);
    const code = row.data[roles.code] || "";
    const description = row.data[roles.description] || "";
    const salePrice = parseFloat(row.data[roles.sale]) || 0;
    const rawQty = row.data[roles.quantity];
    
    const maxQty = parseQuantity(rawQty);
    const unit = parseUnit(rawQty);
    
    if (maxQty <= 0) {
      showNotification("error", "Este producto no tiene stock disponible.");
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.rowId === row.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, maxQty);
        return prev.map(item => item.rowId === row.id ? { ...item, quantity: newQty } : item);
      } else {
        return [...prev, {
          rowId: row.id,
          code,
          description,
          salePrice,
          customPrice: salePrice,
          quantity: 1,
          maxQuantity: maxQty,
          unit
        }];
      }
    });
    
    showNotification("success", `Se agregó "${description}" al carrito.`);
  };

  const updateCartQty = (rowId, newQty) => {
    setCart(prev => prev.map(item => {
      if (item.rowId === rowId) {
        let qty = Math.max(0.1, Math.min(newQty, item.maxQuantity));
        qty = Math.round(qty * 100) / 100;
        return { ...item, quantity: qty };
      }
      return item;
    }));
  };

  const updateCartPrice = (rowId, newPrice) => {
    setCart(prev => prev.map(item => {
      if (item.rowId === rowId) {
        return { ...item, customPrice: Math.max(0, newPrice) };
      }
      return item;
    }));
  };

  const removeFromCart = (rowId) => {
    setCart(prev => prev.filter(item => item.rowId !== rowId));
  };

  const clearCart = () => {
    setCart([]);
    setClientName("Consumidor Final");
  };

  const confirmSale = async () => {
    if (cart.length === 0) return;
    setLoadingDetails(true);
    try {
      const payload = {
        items: cart.map(item => ({
          row_id: item.rowId,
          quantity: item.quantity,
          price: item.customPrice
        }))
      };
      
      const response = await fetch(`${API_BASE}/stores/${selectedStore}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al registrar la venta.");
      }
      
      const updatedRows = await response.json();
      
      // Armar la boleta electrónica antes de vaciar el carrito
      const boletaObj = {
        boletaNumber: `BV-${String(Date.now()).substring(5)}`,
        dateTime: new Date().toLocaleString(),
        storeName: storeDetails.info?.name,
        clientName: clientName,
        sellerName: currentUser?.username || "vendedor",
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.quantity * item.customPrice), 0)
      };
      
      // Actualizar stock localmente
      setStoreDetails(prev => {
        const updatedRowsMap = new Map(updatedRows.map(r => [r.id, r]));
        return {
          ...prev,
          rows: prev.rows.map(r => updatedRowsMap.has(r.id) ? updatedRowsMap.get(r.id) : r)
        };
      });
      
      showNotification("success", `¡Venta registrada con éxito para ${clientName}!`);
      clearCart();
      // Guardar boleta para desplegar el modal
      setSaleReceipt(boletaObj);
      // Recargar datos del dashboard para reflejar la venta
      fetchDashboardData();
    } catch (err) {
      showNotification("error", err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openSellerEditModal = (row) => {
    const roles = getHeaderRoles(storeDetails.info?.headers);
    setSellerEditRow(row);
    setSellerEditPrice(row.data[roles.sale] !== null ? row.data[roles.sale] : "");
    setShowSellerEditModal(true);
  };

  const handleSellerEditPriceSubmit = async (e) => {
    e.preventDefault();
    if (!sellerEditRow) return;
    
    const roles = getHeaderRoles(storeDetails.info?.headers);
    const saleHeader = roles.sale;
    if (!saleHeader) {
      showNotification("error", "No se encontró la columna de precio de venta en esta tienda.");
      return;
    }
    
    const cleanedPrice = cleanValue(sellerEditPrice);
    
    try {
      const response = await fetch(`${API_BASE}/stores/${selectedStore}/rows/${sellerEditRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            [saleHeader]: cleanedPrice
          }
        }),
      });

      if (!response.ok) throw new Error("No se pudo actualizar el precio de venta.");
      
      const updatedRow = await response.json();
      
      // Actualizar localmente
      setStoreDetails(prev => ({
        ...prev,
        rows: prev.rows.map(r => r.id === sellerEditRow.id ? updatedRow : r)
      }));
      
      // Si está en el carrito, actualizar también
      setCart(prev => prev.map(item => {
        if (item.rowId === sellerEditRow.id) {
          return {
            ...item,
            salePrice: parseFloat(cleanedPrice) || 0,
            customPrice: parseFloat(cleanedPrice) || 0
          };
        }
        return item;
      }));
      
      setShowSellerEditModal(false);
      setSellerEditRow(null);
      setSellerEditPrice("");
      showNotification("success", "Precio de venta actualizado correctamente.");
    } catch (err) {
      showNotification("error", err.message);
    }
  };

  const handleLoginSuccess = (user) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    setCurrentUser(user);
    setRole(user.role);
    setCart([]);
    // Redirigir según el rol
    setActiveSection(user.role === "propietario" ? "dashboard" : "stores");
    showNotification("success", `¡Bienvenido, ${user.username}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setRole("");
    setCart([]);
    setSelectedStore(null);
    showNotification("success", "Sesión cerrada correctamente.");
  };

  // Filtrar filas según búsqueda
  const filteredRows = storeDetails.rows.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row.data).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Si no hay usuario logueado, renderizar el Login
  if (!currentUser) {
    return <Login apiBase={API_BASE} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="sidebar-layout">
      {/* Menú Lateral Corporativo */}
      <Sidebar 
        activeSection={activeSection}
        setActiveSection={(section) => {
          setActiveSection(section);
          if (section === "stores" && role !== "vendedor") {
            setSelectedStore(null);
          }
        }}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        role={role}
      />

      <div className="sidebar-main-content">
        {/* Cabecera */}
        <Header 
          currentUser={currentUser} 
          role={role} 
          onLogout={handleLogout} 
          onLogoClick={() => { setActiveSection(role === "propietario" ? "dashboard" : "stores"); }} 
        />

        {/* Notificaciones flotantes */}
        {successMsg && (
          <div className="toast-notification">
            <div className="glass-card" style={{ background: "rgba(16, 185, 129, 0.95)", display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.5rem", borderRadius: "var(--radius-lg)", border: "none" }}>
              <CheckCircle size={20} color="#fff" />
              <span style={{ color: "#fff", fontWeight: 500, fontSize: "0.9rem" }}>{successMsg}</span>
            </div>
          </div>
        )}
        {error && (
          <div className="toast-notification">
            <div className="glass-card" style={{ background: "rgba(244, 63, 94, 0.95)", display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.5rem", borderRadius: "var(--radius-lg)", border: "none" }}>
              <AlertCircle size={20} color="#fff" />
              <span style={{ color: "#fff", fontWeight: 500, fontSize: "0.9rem" }}>{error}</span>
            </div>
          </div>
        )}

        {/* Contenido Principal según sección activa */}
        <main className="main-content">
          {activeSection === "dashboard" ? (
            <DashboardStats
              stats={dashboardStats}
              topProducts={topProducts}
              chartData={chartData}
              loading={loadingStats}
            />
          ) : activeSection === "finanzas" ? (
            <SalesHistory apiBase={API_BASE} stores={stores} />
          ) : activeSection === "usuarios" ? (
            <UsersManagement
              apiBase={API_BASE}
              stores={stores}
              showNotification={showNotification}
            />
          ) : !selectedStore ? (
            role === "vendedor" ? (
              <div className="loading-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "1rem" }}>
                <div className="spinner"></div>
                <span className="loading-text">Cargando información de la tienda...</span>
              </div>
            ) : (
              <Dashboard
                newStoreName={newStoreName}
                setNewStoreName={setNewStoreName}
                handleCreateStore={handleCreateStore}
                loading={loading}
                stores={stores}
                fetchStoreDetails={fetchStoreDetails}
                handleDeleteStore={handleDeleteStore}
                apiBase={API_BASE}
              />
            )
          ) : (
            <StoreDetail
              storeDetails={storeDetails}
              role={role}
              onBackClick={() => { setSelectedStore(null); fetchStores(); }}
              handleExport={handleExport}
              setShowAddModal={() => { setFormData({}); setShowAddModal(true); }}
              handleDeleteStore={handleDeleteStore}
              dragActive={dragActive}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              hideBackButton={role === "vendedor" ? true : false}
              // Cart props
              cart={cart}
              clientName={clientName}
              setClientName={setClientName}
              updateCartQty={updateCartQty}
              updateCartPrice={updateCartPrice}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              confirmSale={confirmSale}
              // ProductTable props
              filteredRows={filteredRows}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              loadingDetails={loadingDetails}
              openEditModal={openEditModal}
              handleDeleteRow={handleDeleteRow}
              openSellerEditModal={openSellerEditModal}
              addToCart={addToCart}
            />
          )}
        </main>
      </div>

      {/* MODALES DE ACCIÓN */}
      <AddProductModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        storeHeaders={storeDetails.info?.headers || []}
        formData={formData}
        onFormChange={handleFormChange}
        isAutocompleted={isAutocompleted}
        onSubmit={handleAddRow}
      />

      <EditProductModal
        show={showEditModal}
        onClose={() => { setShowEditModal(false); setCurrentRow(null); }}
        storeHeaders={storeDetails.info?.headers || []}
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleEditRow}
      />

      <SellerEditPriceModal
        show={showSellerEditModal}
        onClose={() => { setShowSellerEditModal(false); setSellerEditRow(null); }}
        sellerEditRow={sellerEditRow}
        sellerEditPrice={sellerEditPrice}
        setSellerEditPrice={setSellerEditPrice}
        storeHeaders={storeDetails.info?.headers || []}
        onSubmit={handleSellerEditPriceSubmit}
      />

      {/* CONFIRMACIÓN */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* BOLETA ELECTRÓNICA */}
      <ReceiptModal 
        receipt={saleReceipt} 
        onClose={() => setSaleReceipt(null)} 
      />
    </div>
  );
}

export default App;

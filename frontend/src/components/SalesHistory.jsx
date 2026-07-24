import React, { useState, useEffect, useCallback } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  Package,
  Clock,
  Store,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function SalesHistory({ apiBase, stores = [] }) {
  const [activeDays, setActiveDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  
  // Estado para el mes/año visible en el calendario
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  
  const [sales, setSales] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("all");
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);

  // Estados de eliminación
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const tzOffset = new Date().getTimezoneOffset();

  // Cargar días con ventas
  const fetchActiveDays = useCallback(async () => {
    setLoadingDays(true);
    try {
      const res = await fetch(`${apiBase}/sales/active-days?tz_offset=${tzOffset}`);
      if (res.ok) {
        const data = await res.json();
        setActiveDays(data);
      }
    } catch (err) {
      console.error("Error al cargar días activos de ventas:", err);
    } finally {
      setLoadingDays(false);
    }
  }, [apiBase, tzOffset]);

  // Cargar ventas de un día específico
  const fetchSalesForDate = useCallback(async (dateStr) => {
    setLoadingSales(true);
    try {
      const res = await fetch(`${apiBase}/sales/by-date?date=${dateStr}&tz_offset=${tzOffset}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error("Error al cargar ventas para la fecha:", err);
    } finally {
      setLoadingSales(false);
    }
  }, [apiBase, tzOffset]);

  useEffect(() => {
    fetchActiveDays();
  }, [fetchActiveDays]);

  useEffect(() => {
    fetchSalesForDate(selectedDate);
  }, [selectedDate, fetchSalesForDate]);

  const handleDeleteConfirm = async (saleId) => {
    setLoadingDelete(true);
    setDeleteError("");
    try {
      const res = await fetch(`${apiBase}/sales/${saleId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setDeleteSuccess("La venta ha sido eliminada y el stock fue restaurado.");
        setSaleToDelete(null);
        await fetchSalesForDate(selectedDate);
        await fetchActiveDays();
        setTimeout(() => setDeleteSuccess(""), 4000);
      } else {
        const errorData = await res.json();
        setDeleteError(errorData.detail || "Error al eliminar el registro de venta.");
        setTimeout(() => setDeleteError(""), 5000);
      }
    } catch (err) {
      console.error("Error al eliminar venta:", err);
      setDeleteError("Error de conexión al eliminar la venta.");
      setTimeout(() => setDeleteError(""), 5000);
    } finally {
      setLoadingDelete(false);
    }
  };

  // Navegación del calendario
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(dateStr);
  };

  // Filtrar ventas por tienda seleccionada
  const filteredSales = selectedStoreId === "all"
    ? sales
    : sales.filter(s => String(s.store_id) === String(selectedStoreId));

  // Calcular métricas basadas en las ventas filtradas
  const totalIncome = filteredSales.reduce((acc, s) => acc + (s.sale_price * s.quantity), 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
  const totalItemsSold = filteredSales.reduce((acc, s) => acc + s.quantity, 0);

  // Construcción de la cuadrícula del calendario
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIdx = getFirstDayOfMonth(currentYear, currentMonth);

  // Crear celdas de días
  const calendarCells = [];
  
  // Rellenar días del mes anterior para un grid perfecto
  const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYearIdx = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthDays = getDaysInMonth(prevYearIdx, prevMonthIdx);
  
  for (let i = firstDayIdx - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const dateStr = `${prevYearIdx}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    calendarCells.push({ dayNum, dateStr, isCurrentMonth: false });
  }

  // Días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarCells.push({ dayNum: i, dateStr, isCurrentMonth: true });
  }

  // Rellenar días del mes siguiente para completar la cuadrícula (múltiplo de 7, usualmente 42 celdas en total)
  const remainingCells = 42 - calendarCells.length;
  const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYearIdx = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    const dateStr = `${nextYearIdx}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    calendarCells.push({ dayNum: i, dateStr, isCurrentMonth: false });
  }

  // Comprobar si es hoy
  const isDateToday = (dateStr) => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}` === dateStr;
  };

  // Formatear hora de fecha UTC
  const formatSaleTime = (utcString) => {
    try {
      const date = new Date(utcString);
      return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "00:00";
    }
  };

  return (
    <div className="dashboard-stats-container">
      <div className="dashboard-title-row">
        <h1 className="dashboard-page-title">Historial de Ventas</h1>
        <span className="dashboard-page-subtitle">Visualización diaria de productos vendidos e ingresos</span>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "minmax(320px, 350px) minmax(0, 1fr)", gap: "2rem" }}>
        
        {/* Columna Izquierda: Calendario & KPIs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Card de Calendario */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                <CalendarIcon size={18} color="var(--accent-primary)" />
                {MONTHS[currentMonth]} {currentYear}
              </h3>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button 
                  onClick={handlePrevMonth} 
                  className="btn btn-secondary btn-icon-only" 
                  style={{ width: "28px", height: "28px", padding: 0 }}
                  title="Mes Anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={handleGoToToday} 
                  className="btn btn-secondary" 
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", height: "28px" }}
                  title="Hoy"
                >
                  Hoy
                </button>
                <button 
                  onClick={handleNextMonth} 
                  className="btn btn-secondary btn-icon-only" 
                  style={{ width: "28px", height: "28px", padding: 0 }}
                  title="Mes Siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Cabecera días de la semana */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "0.5rem" }}>
              {WEEKDAYS.map(d => (
                <span key={d} style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Rejilla de días */}
            {loadingDays ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                <div className="spinner" style={{ width: "24px", height: "24px" }}></div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {calendarCells.map((cell, idx) => {
                  const isSelected = selectedDate === cell.dateStr;
                  const hasSales = activeDays.includes(cell.dateStr);
                  const isToday = isDateToday(cell.dateStr);
                  
                  // Estilos interactivos dinámicos
                  let cellStyle = {
                    aspectRatio: "1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: cell.isCurrentMonth ? "500" : "400",
                    borderRadius: "50%",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.15s ease",
                    border: isToday ? "1.5px solid var(--accent-primary)" : "none",
                  };

                  if (isSelected) {
                    cellStyle.backgroundColor = "var(--accent-primary)";
                    cellStyle.color = "#ffffff";
                    cellStyle.fontWeight = "600";
                  } else if (!cell.isCurrentMonth) {
                    cellStyle.color = "var(--text-muted)";
                    cellStyle.opacity = 0.4;
                  } else {
                    cellStyle.color = "var(--text-primary)";
                  }

                  return (
                    <div 
                      key={idx} 
                      style={cellStyle}
                      className={`calendar-day-cell ${isSelected ? "" : "calendar-day-hover"}`}
                      onClick={() => setSelectedDate(cell.dateStr)}
                    >
                      <span>{cell.dayNum}</span>
                      
                      {/* Indicador visual de venta */}
                      {hasSales && (
                        <span style={{
                          position: "absolute",
                          bottom: "4px",
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          backgroundColor: isSelected ? "#ffffff" : "var(--accent-success)",
                          boxShadow: isSelected ? "none" : "0 0 4px var(--accent-success)"
                        }}></span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* KPIs del día */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="kpi-card kpi-blue" style={{ padding: "1.25rem" }}>
              <div className="kpi-icon-box" style={{ width: "38px", height: "38px" }}>
                <DollarSign size={20} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value" style={{ fontSize: "1.25rem" }}>
                  ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="kpi-label" style={{ fontSize: "0.75rem" }}>Ingresos del Día</span>
              </div>
            </div>

            <div className="kpi-card kpi-green" style={{ padding: "1.25rem" }}>
              <div className="kpi-icon-box" style={{ width: "38px", height: "38px" }}>
                <TrendingUp size={20} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value" style={{ fontSize: "1.25rem" }}>
                  ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="kpi-label" style={{ fontSize: "0.75rem" }}>Ganancias del Día</span>
              </div>
            </div>

            <div className="kpi-card kpi-yellow" style={{ padding: "1.25rem" }}>
              <div className="kpi-icon-box" style={{ width: "38px", height: "38px" }}>
                <Package size={20} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value" style={{ fontSize: "1.25rem" }}>
                  {totalItemsSold.toFixed(1).endsWith(".0") ? Math.round(totalItemsSold) : totalItemsSold.toFixed(2)}
                </span>
                <span className="kpi-label" style={{ fontSize: "0.75rem" }}>Unidades Vendidas</span>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Detalle de productos vendidos */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 className="card-title" style={{ margin: 0, fontSize: "1.1rem" }}>
              Ventas Registradas: {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </h2>
            
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {/* Selector de Tienda */}
              {stores && stores.length > 0 && (
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="form-input"
                  style={{ 
                    width: "auto", 
                    minWidth: "160px", 
                    padding: "0.4rem 2rem 0.4rem 0.75rem", 
                    fontSize: "0.85rem", 
                    height: "auto", 
                    minHeight: "34px",
                    margin: 0
                  }}
                >
                  <option value="all">Todas las Tiendas</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              )}

              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", background: "var(--bg-tertiary)", padding: "0.25rem 0.6rem", borderRadius: "9999px", fontWeight: 500 }}>
                {filteredSales.length} {filteredSales.length === 1 ? "Venta" : "Ventas"}
              </span>
            </div>
          </div>

          {loadingSales ? (
            <div className="loading-container" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
              <div className="spinner"></div>
              <span className="loading-text">Buscando transacciones...</span>
            </div>
          ) : sales.length === 0 ? (
            <div className="empty-state" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "4rem 2rem" }}>
              <CalendarIcon size={48} className="empty-state-icon" style={{ opacity: 0.3, marginBottom: "1rem" }} />
              <p className="empty-state-title" style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Sin ventas registradas</p>
              <p className="empty-state-desc" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", maxWidth: "320px" }}>
                No se registraron ventas en esta fecha. Selecciona otro día con un punto indicador en el calendario.
              </p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="empty-state" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "4rem 2rem" }}>
              <CalendarIcon size={48} className="empty-state-icon" style={{ opacity: 0.3, marginBottom: "1rem" }} />
              <p className="empty-state-title" style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Sin ventas en esta tienda</p>
              <p className="empty-state-desc" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", maxWidth: "320px" }}>
                No se registraron ventas para la tienda seleccionada en esta fecha.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ border: "none", boxShadow: "none", maxHeight: "none", flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Cod. Producto</th>
                    <th>Descripción</th>
                    <th>Cant.</th>
                    <th>P. Unitario</th>
                    <th>Total</th>
                    <th>Ganancia</th>
                    <th style={{ textAlign: "center" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale, idx) => (
                    <tr key={sale.id || idx}>
                      <td style={{ color: "var(--text-secondary)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Clock size={13} style={{ color: "var(--text-muted)" }} />
                          {formatSaleTime(sale.sold_at)}
                        </span>
                      </td>
                      <td>
                        <span className="product-rank-badge" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)", fontWeight: 600 }}>
                          {sale.product_code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{sale.description}</td>
                      <td>{sale.quantity}</td>
                      <td>${sale.sale_price.toFixed(2)}</td>
                      <td style={{ fontWeight: 600 }}>${(sale.sale_price * sale.quantity).toFixed(2)}</td>
                      <td style={{ 
                        fontWeight: 600, 
                        color: sale.profit >= 0 ? "var(--accent-success)" : "var(--accent-danger)" 
                      }}>
                        {sale.profit >= 0 ? "+" : ""}${sale.profit.toFixed(2)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn btn-danger btn-icon-only"
                          style={{ width: "28px", height: "28px", padding: 0 }}
                          title="Eliminar venta y restaurar stock"
                          onClick={() => setSaleToDelete(sale)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {saleToDelete && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="glass-card" style={{ maxWidth: "420px", width: "100%", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h3 className="card-title" style={{ margin: 0, color: "var(--accent-danger)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Trash2 size={22} />
              ¿Eliminar Registro de Venta?
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
              ¿Estás seguro de que deseas eliminar el registro de la venta de <strong>{saleToDelete.quantity}x {saleToDelete.description}</strong>?
              <br />
              <br />
              <span style={{ color: "var(--accent-primary)", fontWeight: 500 }}>
                Nota: El stock correspondiente se devolverá automáticamente al inventario de la tienda "{saleToDelete.store_name}".
              </span>
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSaleToDelete(null)}
                disabled={loadingDelete}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleDeleteConfirm(saleToDelete.id)}
                disabled={loadingDelete}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {loadingDelete ? (
                  <div className="spinner" style={{ width: "14px", height: "14px", border: "2px solid #ffffff", borderTopColor: "transparent" }}></div>
                ) : <Trash2 size={15} />}
                <span>Eliminar Venta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIONES DE ÉXITO O ERROR */}
      {deleteSuccess && (
        <div className="toast-notification">
          <div className="glass-card" style={{ background: "rgba(16, 185, 129, 0.95)", display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.5rem", borderRadius: "var(--radius-lg)", border: "none" }}>
            <CheckCircle size={20} color="#fff" />
            <span style={{ color: "#fff", fontWeight: 500, fontSize: "0.9rem" }}>{deleteSuccess}</span>
          </div>
        </div>
      )}
      {deleteError && (
        <div className="toast-notification">
          <div className="glass-card" style={{ background: "rgba(244, 63, 94, 0.95)", display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.5rem", borderRadius: "var(--radius-lg)", border: "none" }}>
            <AlertCircle size={20} color="#fff" />
            <span style={{ color: "#fff", fontWeight: 500, fontSize: "0.9rem" }}>{deleteError}</span>
          </div>
        </div>
      )}

      {/* Agregar estilos CSS específicos en línea para el hover del calendario */}
      <style>{`
        .calendar-day-hover:hover {
          background-color: rgba(99, 102, 241, 0.08) !important;
          color: var(--accent-primary) !important;
        }
      `}</style>
    </div>
  );
}

export default SalesHistory;


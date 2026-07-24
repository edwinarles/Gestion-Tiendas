import React from "react";
import { 
  BarChart2, 
  Database, 
  DollarSign, 
  ShoppingBag, 
  LifeBuoy, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users
} from "lucide-react";

function Sidebar({ activeSection, setActiveSection, onLogout, isCollapsed, setIsCollapsed, role }) {
  const menuItems = [
    ...(role === "propietario" ? [
      { id: "dashboard", label: "Gráficos / Dashboard", icon: BarChart2, active: true }
    ] : []),
    { id: "stores", label: "Inventario / Tiendas", icon: Database, active: true },
    ...(role === "propietario" ? [
      { id: "finanzas", label: "Finanzas", icon: DollarSign, active: true },
      { id: "usuarios", label: "Usuarios / Vendedores", icon: Users, active: true },
      { id: "compras", label: "Compras", icon: ShoppingBag, active: false }
    ] : []),
    { id: "soporte", label: "Soporte", icon: LifeBuoy, active: false }
  ];


  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        <div className="logo-icon-box">CB</div>
        {!isCollapsed && <span className="logo-title">ClandBus</span>}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-item ${isItemActive ? "active" : ""} ${!item.active ? "disabled" : ""}`}
              onClick={() => {
                if (item.active) {
                  setActiveSection(item.id);
                }
              }}
              title={item.label}
            >
              <Icon size={20} className="sidebar-icon" />
              {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button 
          type="button" 
          className="sidebar-item logout-btn" 
          onClick={onLogout}
          title="Cerrar Sesión"
        >
          <LogOut size={20} className="sidebar-icon" />
          {!isCollapsed && <span className="sidebar-label">Cerrar Sesión</span>}
        </button>

        <button 
          type="button" 
          className="collapse-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expandir" : "Contraer"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;

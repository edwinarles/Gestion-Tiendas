import React from "react";
import { Store, User } from "lucide-react";

function Header({ currentUser, role, onLogout, onLogoClick }) {
  return (
    <header className="header">
      <div
        className="logo-container"
        style={{ cursor: "pointer" }}
        onClick={onLogoClick}
      >
        <Store className="logo-icon" size={28} />
        <span className="logo-text">Gestion Tiendas</span>
      </div>

      {currentUser && (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="user-profile-header">
            <div className="user-avatar">
              <User size={16} />
            </div>
            <div className="user-info-text">
              <span className="user-name-text">{currentUser.username}</span>
              <span className={`user-role-badge ${role}`}>{role === "propietario" ? "Propietario" : "Vendedor"}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLogout}
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      <div className="db-status">
        <div className="status-dot" style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--accent-success)" }}></div>
        <span>PostgreSQL / SQLite Activo</span>
      </div>
    </header>
  );
}

export default Header;

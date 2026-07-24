import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Shield, User, X } from "lucide-react";

function UsersManagement({ apiBase, stores, showNotification }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("vendedor");
  const [storeId, setStoreId] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showNotification("error", "Error al cargar la lista de usuarios");
      }
    } catch (err) {
      showNotification("error", "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showNotification("error", "Por favor completa el nombre de usuario y contraseña");
      return;
    }

    if (role === "vendedor" && !storeId) {
      showNotification("error", "Por favor selecciona una tienda para el vendedor");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role,
          store_id: role === "vendedor" ? storeId : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification("success", `Usuario "${data.username}" creado exitosamente`);
        setShowAddModal(false);
        // Reset fields
        setUsername("");
        setPassword("");
        setRole("vendedor");
        setStoreId("");
        fetchUsers();
      } else {
        showNotification("error", data.detail || "Error al crear el usuario");
      }
    } catch (err) {
      showNotification("error", "Error de conexión al crear el usuario");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (userName === "propietario") {
      showNotification("error", "No puedes eliminar el usuario administrador");
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar al usuario "${userName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${apiBase}/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showNotification("success", `Usuario "${userName}" eliminado`);
        fetchUsers();
      } else {
        const data = await res.json();
        showNotification("error", data.detail || "Error al eliminar el usuario");
      }
    } catch (err) {
      showNotification("error", "Error de conexión al eliminar el usuario");
    }
  };

  // Ayudante para obtener nombre de tienda por su ID
  const getStoreName = (id) => {
    if (!id) return "-";
    const store = stores.find((s) => s.id === id);
    return store ? store.name : "Tienda no encontrada";
  };

  return (
    <div className="dashboard-stats-container">
      <div className="dashboard-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="dashboard-page-title">Gestión de Usuarios</h1>
          <p className="dashboard-page-subtitle">Crea y administra accesos para vendedores asignados a tiendas específicas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="glass-card" style={{ padding: "1.5rem" }}>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span className="loading-text">Cargando usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <p className="empty-state-title">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Tienda Asignada</th>
                  <th className="row-actions-cell" style={{ textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <User size={16} color="var(--accent-primary)" />
                        {u.username}
                      </div>
                    </td>
                    <td>
                      <span className={`user-role-badge ${u.role}`} style={{ display: "inline-block" }}>
                        {u.role === "propietario" ? "Propietario" : "Vendedor"}
                      </span>
                    </td>
                    <td>
                      {u.role === "propietario" ? (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Todas las Tiendas</span>
                      ) : (
                        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                          {getStoreName(u.store_id)}
                        </span>
                      )}
                    </td>
                    <td className="row-actions-cell" style={{ textAlign: "center" }}>
                      {u.username !== "propietario" ? (
                        <button
                          type="button"
                          className="row-action-btn delete"
                          title="Eliminar Usuario"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <Shield size={16} color="var(--text-muted)" title="Administrador Protegido" style={{ margin: "0 auto" }} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear Usuario */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Users size={20} color="var(--accent-primary)" />
                Crear Nuevo Usuario
              </h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre de Usuario</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Ej. vendedor_norte"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contraseña</label>
                    <input
                      type="password"
                      className="form-input"
                      required
                      placeholder="Contraseña de acceso..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rol del Usuario</label>
                    <select
                      className="form-input"
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        if (e.target.value === "propietario") {
                          setStoreId("");
                        }
                      }}
                    >
                      <option value="vendedor">Vendedor (Acceso limitado)</option>
                      <option value="propietario">Propietario (Acceso total)</option>
                    </select>
                  </div>

                  {role === "vendedor" && (
                    <div className="form-group">
                      <label className="form-label">Asignar a Tienda</label>
                      <select
                        className="form-input"
                        required
                        value={storeId}
                        onChange={(e) => setStoreId(e.target.value)}
                      >
                        <option value="">-- Selecciona una tienda --</option>
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersManagement;

import React, { useState } from "react";
import { Store, AlertCircle } from "lucide-react";

function Login({ apiBase, onLoginSuccess }) {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const requestUrl = `${apiBase}/login`;
    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });

      if (!response.ok) {
        let errMsg = "Error al iniciar sesión";
        try {
          const errorData = await response.json();
          errMsg = errorData.detail || errMsg;
        } catch (jsonErr) {
          try {
            const textData = await response.text();
            errMsg = textData || `Error del servidor (${response.status})`;
          } catch (textErr) {
            errMsg = `Error del servidor (${response.status})`;
          }
        }
        throw new Error(`${errMsg} (URL: ${requestUrl})`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error(`La respuesta del servidor no es un JSON válido. (URL: ${requestUrl})`);
      }

      if (data && data.success) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <Store size={28} />
          </div>
          <h2 className="login-title">Gestion Tiendas</h2>
          <p className="login-subtitle">Inicia sesión para gestionar inventarios</p>
        </div>

        {loginError && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ingresa tu usuario"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
              disabled={loginLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="Ingresa tu contraseña"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              disabled={loginLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.625rem", marginTop: "0.5rem" }}
            disabled={loginLoading}
          >
            {loginLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

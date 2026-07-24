import React from "react";
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  AlertTriangle,
  Award
} from "lucide-react";

function DashboardStats({ stats, topProducts, chartData, loading }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <span className="loading-text">Cargando estadísticas del negocio...</span>
      </div>
    );
  }

  // Encontrar el valor máximo para escalar el gráfico SVG
  const maxVal = Math.max(
    ...chartData.map(d => Math.max(d.sales, d.profit)),
    100 // Valor mínimo para evitar divisiones por cero y escalar adecuadamente
  );

  return (
    <div className="dashboard-stats-container">
      <div className="dashboard-title-row">
        <h1 className="dashboard-page-title">Gerente de Inventarios & Finanzas</h1>
        <span className="dashboard-page-subtitle">Indicadores clave de rendimiento</span>
      </div>

      {/* Tarjetas de KPI */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon-box">
            <DollarSign size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">${stats.total_sales?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="kpi-label">Ingresos por Ventas</span>
          </div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-icon-box">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">${stats.total_profit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="kpi-label">Ganancia Total</span>
          </div>
        </div>

        <div className="kpi-card kpi-yellow">
          <div className="kpi-icon-box">
            <Percent size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.avg_margin?.toFixed(1)}%</span>
            <span className="kpi-label">Margen de Ganancia</span>
          </div>
        </div>

        <div className="kpi-card kpi-red">
          <div className="kpi-icon-box">
            <AlertTriangle size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.low_stock_count}</span>
            <span className="kpi-label">Stock Bajo (≤ 5 und)</span>
          </div>
        </div>
      </div>

      {/* Fila de Gráfico y Tabla de Productos Rentables */}
      <div className="dashboard-visual-grid">
        
        {/* Gráfico SVG */}
        <div className="glass-card chart-card">
          <h3 className="card-title">Relación de Ventas y Ganancias</h3>
          
          <div className="chart-wrapper">
            {chartData.length === 0 ? (
              <div className="empty-state" style={{ padding: "2rem" }}>
                No hay datos de ventas disponibles para graficar.
              </div>
            ) : (
              <svg viewBox="0 0 600 320" className="dashboard-svg-chart">
                {/* Líneas de cuadrícula horizontal */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = 40 + ratio * 200;
                  const labelValue = maxVal * (1 - ratio);
                  return (
                    <g key={i}>
                      <line 
                        x1="60" 
                        y1={y} 
                        x2="560" 
                        y2={y} 
                        stroke="rgba(0, 0, 0, 0.05)" 
                        strokeDasharray="4 4" 
                      />
                      <text 
                        x="50" 
                        y={y + 4} 
                        textAnchor="end" 
                        fontSize="10" 
                        fill="var(--text-muted)"
                      >
                        ${Math.round(labelValue)}
                      </text>
                    </g>
                  );
                })}

                {/* Ejes */}
                <line x1="60" y1="40" x2="60" y2="240" stroke="var(--border-color)" strokeWidth="1" />
                <line x1="60" y1="240" x2="560" y2="240" stroke="var(--border-color)" strokeWidth="1" />

                {/* Barras dinámicas */}
                {chartData.map((d, idx) => {
                  const count = chartData.length;
                  const spacing = 500 / count;
                  const groupWidth = spacing * 0.7;
                  const xGroupStart = 60 + idx * spacing + (spacing - groupWidth) / 2;
                  
                  const salesHeight = (d.sales / maxVal) * 200;
                  const profitHeight = (d.profit / maxVal) * 200;
                  
                  const salesY = 240 - salesHeight;
                  const profitY = 240 - profitHeight;
                  
                  const barWidth = groupWidth * 0.45;

                  return (
                    <g key={idx}>
                      {/* Barra de Ventas */}
                      <rect
                        x={xGroupStart}
                        y={salesY}
                        width={barWidth}
                        height={salesHeight}
                        fill="url(#salesGrad)"
                        rx="4"
                      />
                      {/* Barra de Ganancia */}
                      <rect
                        x={xGroupStart + barWidth + groupWidth * 0.08}
                        y={profitY}
                        width={barWidth}
                        height={profitHeight}
                        fill="url(#profitGrad)"
                        rx="4"
                      />
                      {/* Etiqueta del eje X */}
                      <text
                        x={xGroupStart + groupWidth / 2}
                        y="260"
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--text-secondary)"
                        fontWeight="500"
                      >
                        {d.label.length > 12 ? d.label.substring(0, 10) + ".." : d.label}
                      </text>
                    </g>
                  );
                })}

                {/* Gradientes de color para barras */}
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>

          {/* Leyenda del gráfico */}
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color-box" style={{ backgroundColor: "#4f46e5" }}></div>
              <span>Ventas Totales</span>
            </div>
            <div className="legend-item">
              <div className="legend-color-box" style={{ backgroundColor: "#10b981" }}></div>
              <span>Ganancias</span>
            </div>
          </div>
        </div>

        {/* Tabla de Productos Más Rentables */}
        <div className="glass-card top-products-card">
          <h3 className="card-title">
            <Award size={20} className="logo-icon" style={{ color: "var(--accent-warning)", filter: "none" }} />
            Productos de Mayor Rendimiento (Ganancia)
          </h3>
          
          <div className="table-container" style={{ border: "none", boxShadow: "none", maxHeight: "280px" }}>
            {topProducts.length === 0 ? (
              <div className="empty-state" style={{ border: "none", padding: "3rem 1rem" }}>
                Aún no hay registros de ventas para clasificar beneficios.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cod.</th>
                    <th>Descripción</th>
                    <th>Cant.</th>
                    <th>Ventas ($)</th>
                    <th>Ganancia ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, idx) => (
                    <tr key={p.product_code + idx}>
                      <td><span className="product-rank-badge">{p.product_code}</span></td>
                      <td style={{ fontWeight: 500 }}>{p.description}</td>
                      <td>{p.quantity_sold}</td>
                      <td>${p.total_revenue.toFixed(2)}</td>
                      <td style={{ fontWeight: 600, color: "var(--accent-success)" }}>
                        +${p.total_profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardStats;

export const getHeaderRoles = (headers) => {
  if (!headers) return {};
  const roles = {};
  headers.forEach(h => {
    const lower = h.toLowerCase().trim();
    if (['codigo', 'código', 'code', 'id'].includes(lower)) {
      roles.code = h;
    } else if (['descripcion', 'descripción', 'description', 'detalle'].includes(lower)) {
      roles.description = h;
    } else if (['precio unitario compra', 'precio unitario', 'precio compra', 'p.unitario', 'compra'].includes(lower)) {
      roles.price = h;
    } else if (['precio de venta', 'precio venta', 'p.venta', 'venta'].includes(lower)) {
      roles.sale = h;
    } else if (['cantidad', 'cant', 'quantity', 'qty'].includes(lower)) {
      roles.quantity = h;
    } else if (['tienda', 'store', 'sucursal'].includes(lower)) {
      roles.store = h;
    }
  });
  return roles;
};

export const parseQuantity = (val) => {
  if (val === null || val === undefined) return 0;
  const s = String(val).trim();
  const match = s.match(/^([\d\.,]+)/);
  if (match) {
    const num = parseFloat(match[1].replace(",", "."));
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export const parseUnit = (val) => {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  const match = s.match(/^[\d\.,]+\s*(.*)$/);
  if (match) {
    return match[1].trim();
  }
  return "";
};

export const cleanValue = (val) => {
  if (val === "" || val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  if (!isNaN(trimmed) && trimmed !== "") {
    return Number(trimmed);
  }
  return trimmed;
};

import io
import datetime
from typing import List, Dict, Any
import numpy as np
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import schemas
from database import engine, get_db

# Importar componentes de autenticación y base de datos de usuarios
import auth_utils
import database_users
from database_users import users_engine, UsersBase, User, UsersSessionLocal, get_users_db

# Crear tablas en la base de datos al arrancar
models.Base.metadata.create_all(bind=engine)
UsersBase.metadata.create_all(bind=users_engine)

# Sembrar usuarios por defecto si no existen
db_session = UsersSessionLocal()
try:
    if not db_session.query(User).filter(User.username == "propietario").first():
        prop_user = User(
            username="propietario",
            password=auth_utils.hash_password("propietario123"),
            role="propietario"
        )
        db_session.add(prop_user)
    if not db_session.query(User).filter(User.username == "vendedor").first():
        vend_user = User(
            username="vendedor",
            password=auth_utils.hash_password("vendedor123"),
            role="vendedor"
        )
        db_session.add(vend_user)
    db_session.commit()
except Exception as e:
    print(f"Error al sembrar usuarios: {e}")
    db_session.rollback()
finally:
    db_session.close()


app = FastAPI(
    title="Excel Store Sync API",
    description="API para almacenar y consolidar inventarios de tiendas en base de datos",
    version="1.0.0"
)

# Configurar CORS para permitir peticiones del frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, restringir a dominios autorizados
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_value(val: Any) -> Any:
    """Limpia los valores cargados de pandas para asegurar que sean compatibles con JSON."""
    if pd.isna(val) or val is pd.NaT:
        return None
    if isinstance(val, (np.integer, np.int64, np.int32)):
        return int(val)
    if isinstance(val, (np.floating, np.float64, np.float32)):
        return float(val)
    if isinstance(val, (np.ndarray, list)):
        return [clean_value(x) for x in val]
    if isinstance(val, datetime.datetime):
        return val.isoformat()
    return val

@app.get("/")
def read_root():
    return {"status": "ok", "message": "API de Gestión por Tiendas activa"}

@app.post("/api/login", response_model=schemas.LoginResponse)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_users_db)):
    username_clean = login_data.username.strip() if login_data.username else ""
    user = db.query(User).filter(User.username == username_clean).first()
    if not user or not auth_utils.verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    return {
        "success": True,
        "user": {
            "username": user.username,
            "role": user.role
        },
        "message": "Inicio de sesión exitoso"
    }


# 1. Crear una Tienda
@app.post("/api/stores", response_model=schemas.StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(store_in: schemas.StoreBase, db: Session = Depends(get_db)):
    # Columnas predeterminadas para cuando la tienda se crea manualmente
    DEFAULT_HEADERS = ["Código", "Descripción", "Cantidad", "Precio Unitario", "Precio Venta"]
    
    db_store = models.Store(
        name=store_in.name,
        headers=DEFAULT_HEADERS
    )
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store

# 2. Listar todas las tiendas
@app.get("/api/stores", response_model=List[schemas.StoreResponse])
def list_stores(db: Session = Depends(get_db)):
    return db.query(models.Store).order_by(models.Store.created_at.desc()).all()

# 3. Obtener detalle de una tienda (metadatos + filas)
@app.get("/api/stores/{store_id}", response_model=schemas.StoreDetailResponse)
def get_store(store_id: str, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    
    rows = db.query(models.StoreRow).filter(
        models.StoreRow.store_id == store_id
    ).order_by(models.StoreRow.row_index.asc()).all()
    
    return {"info": store, "rows": rows}

# 4. Eliminar una tienda completa
@app.delete("/api/stores/{store_id}")
def delete_store(store_id: str, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
    db.delete(store)
    db.commit()
    return {"message": f"Tienda '{store.name}' y sus productos han sido eliminados"}

# 5. Cargar archivo Excel a una Tienda específica (Consolida y acumula)
@app.post("/api/stores/{store_id}/upload", response_model=schemas.StoreDetailResponse, status_code=status.HTTP_200_OK)
async def upload_excel_to_store(store_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")

    # Validar extensión
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Formato de archivo no válido. Solo se admiten archivos .xlsx o .xls"
        )
    
    try:
        # Leer archivo a memoria
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail=f"Error al procesar el archivo Excel: {str(e)}"
        )
    
    excel_headers = [str(col).strip() for col in df.columns]
    
    # Combinar headers manteniendo el orden
    store_headers = list(store.headers or [])
    for h in excel_headers:
        if h not in store_headers:
            store_headers.append(h)
    store.headers = store_headers
    
    # Encontrar columnas clave en las columnas de la tienda
    code_header = next((h for h in store.headers if h.lower().strip() in ['codigo', 'código', 'code', 'id']), None)
    qty_header = next((h for h in store.headers if h.lower().strip() in ['cantidad', 'cant', 'quantity', 'qty']), None)
    
    # Cargar productos existentes para buscar duplicados en memoria
    existing_rows = db.query(models.StoreRow).filter(models.StoreRow.store_id == store_id).all()
    existing_by_code = {}
    if code_header:
        for r in existing_rows:
            c_val = str(r.data.get(code_header) or "").strip().lower()
            if c_val:
                existing_by_code[c_val] = r

    import re
    def parse_qty_val(q):
        if q is None or q == "":
            return 0.0, ""
        s = str(q).strip()
        match = re.match(r"^([\d\.,]+)\s*(.*)$", s)
        if match:
            num_str = match.group(1).replace(",", ".")
            unit = match.group(2).strip()
            try:
                return float(num_str), unit
            except ValueError:
                return 0.0, s
        return 0.0, s

    new_db_rows = []
    max_idx = db.query(func.max(models.StoreRow.row_index)).filter(
        models.StoreRow.store_id == store_id
    ).scalar()
    next_idx = 0 if max_idx is None else max_idx + 1

    for idx, row in df.iterrows():
        row_dict = row.to_dict()
        cleaned_row_data = {str(k).strip(): clean_value(v) for k, v in row_dict.items()}
        
        # Rellenar con None los campos de la tienda que falten en el Excel
        for h in store.headers:
            if h not in cleaned_row_data:
                cleaned_row_data[h] = None
        
        # Buscar coincidencia
        matched_row = None
        if code_header:
            new_code = str(cleaned_row_data.get(code_header) or "").strip().lower()
            if new_code:
                matched_row = existing_by_code.get(new_code)
        
        if matched_row:
            # Acumular
            if qty_header:
                old_qty = matched_row.data.get(qty_header)
                new_qty = cleaned_row_data.get(qty_header)
                
                n1, u1 = parse_qty_val(old_qty)
                n2, u2 = parse_qty_val(new_qty)
                
                total = n1 + n2
                unit = u1 if u1 else u2
                
                if total.is_integer():
                    total = int(total)
                
                summed_qty = f"{total} {unit}" if unit else total
                
                merged_data = matched_row.data.copy()
                merged_data.update(cleaned_row_data)
                merged_data[qty_header] = summed_qty
                matched_row.data = merged_data
            else:
                merged_data = matched_row.data.copy()
                merged_data.update(cleaned_row_data)
                matched_row.data = merged_data
        else:
            # Crear nueva fila
            db_row = models.StoreRow(
                store_id=store_id,
                row_index=next_idx,
                data=cleaned_row_data
            )
            new_db_rows.append(db_row)
            # Agregar al diccionario de búsqueda para evitar duplicados en el mismo archivo
            if code_header:
                new_code = str(cleaned_row_data.get(code_header) or "").strip().lower()
                if new_code:
                    existing_by_code[new_code] = db_row
            next_idx += 1
            
    try:
        if new_db_rows:
            db.bulk_save_objects(new_db_rows)
        store.updated_at = datetime.datetime.utcnow()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar los datos en la base de datos: {str(e)}"
        )
        
    # Obtener todas las filas actualizadas
    updated_rows = db.query(models.StoreRow).filter(
        models.StoreRow.store_id == store_id
    ).order_by(models.StoreRow.row_index.asc()).all()
    
    return {"info": store, "rows": updated_rows}

# 6. Agregar un producto manualmente a una tienda (Acumula si existe)
@app.post("/api/stores/{store_id}/rows", response_model=schemas.StoreRowResponse, status_code=status.HTTP_201_CREATED)
def add_row_to_store(store_id: str, row_in: schemas.StoreRowBase, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    
    # Limpiar los valores entrantes
    cleaned_data = {str(k).strip(): clean_value(v) for k, v in row_in.data.items()}
    
    # Rellenar campos faltantes definidos en los headers con None
    for header in store.headers:
        if header not in cleaned_data:
            cleaned_data[header] = None
            
    # Encontrar los nombres de columnas de Código y Cantidad
    code_header = next((h for h in store.headers if h.lower().strip() in ['codigo', 'código', 'code', 'id']), None)
    qty_header = next((h for h in store.headers if h.lower().strip() in ['cantidad', 'cant', 'quantity', 'qty']), None)
    
    existing_row = None
    if code_header:
        new_code = str(cleaned_data.get(code_header) or "").strip().lower()
        if new_code:
            # Buscar en las filas de la tienda
            all_rows = db.query(models.StoreRow).filter(
                models.StoreRow.store_id == store_id
            ).all()
            for r in all_rows:
                r_code = str(r.data.get(code_header) or "").strip().lower()
                if r_code == new_code:
                    existing_row = r
                    break

    import re
    def parse_qty_val(q):
        if q is None or q == "":
            return 0.0, ""
        s = str(q).strip()
        match = re.match(r"^([\d\.,]+)\s*(.*)$", s)
        if match:
            num_str = match.group(1).replace(",", ".")
            unit = match.group(2).strip()
            try:
                return float(num_str), unit
            except ValueError:
                return 0.0, s
        return 0.0, s

    if existing_row:
        if qty_header:
            old_qty = existing_row.data.get(qty_header)
            new_qty = cleaned_data.get(qty_header)
            
            n1, u1 = parse_qty_val(old_qty)
            n2, u2 = parse_qty_val(new_qty)
            
            total = n1 + n2
            unit = u1 if u1 else u2
            
            if total.is_integer():
                total = int(total)
            
            summed_qty = f"{total} {unit}" if unit else total
                
            merged_data = existing_row.data.copy()
            merged_data.update(cleaned_data)
            merged_data[qty_header] = summed_qty
            existing_row.data = merged_data
        else:
            merged_data = existing_row.data.copy()
            merged_data.update(cleaned_data)
            existing_row.data = merged_data
            
        store.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing_row)
        return existing_row

    # Obtener el siguiente índice de fila si es una fila nueva
    max_idx = db.query(func.max(models.StoreRow.row_index)).filter(
        models.StoreRow.store_id == store_id
    ).scalar()
    next_idx = 0 if max_idx is None else max_idx + 1

    db_row = models.StoreRow(
        store_id=store_id,
        row_index=next_idx,
        data=cleaned_data
    )
    
    db.add(db_row)
    store.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(db_row)
    return db_row

# 7. Editar un producto de una tienda
@app.put("/api/stores/{store_id}/rows/{row_id}", response_model=schemas.StoreRowResponse)
def update_store_row(store_id: str, row_id: int, row_in: schemas.StoreRowUpdate, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
    db_row = db.query(models.StoreRow).filter(
        models.StoreRow.id == row_id,
        models.StoreRow.store_id == store_id
    ).first()
    
    if not db_row:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    cleaned_data = {str(k).strip(): clean_value(v) for k, v in row_in.data.items()}
    
    # Conservar campos existentes que no fueron actualizados
    merged_data = db_row.data.copy()
    merged_data.update(cleaned_data)
    
    db_row.data = merged_data
    store.updated_at = datetime.datetime.utcnow()
    
    db.commit()
    db.refresh(db_row)
    return db_row

# 8. Eliminar un producto de una tienda
@app.delete("/api/stores/{store_id}/rows/{row_id}")
def delete_store_row(store_id: str, row_id: int, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
    db_row = db.query(models.StoreRow).filter(
        models.StoreRow.id == row_id,
        models.StoreRow.store_id == store_id
    ).first()
    
    if not db_row:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    db.delete(db_row)
    store.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": f"Producto {row_id} eliminado exitosamente"}

# 8.5. Descontar cantidad de productos (Ventas)
@app.post("/api/stores/{store_id}/sell", response_model=List[schemas.StoreRowResponse])
def sell_store_rows(store_id: str, sell_in: schemas.SaleRequest, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
    qty_header = next((h for h in store.headers if h.lower().strip() in ['cantidad', 'cant', 'quantity', 'qty']), None)
    if not qty_header:
        raise HTTPException(status_code=400, detail="La tienda no tiene una columna de cantidad configurada")
        
    import re
    def parse_qty_val(q):
        if q is None or q == "":
            return 0.0, ""
        s = str(q).strip()
        match = re.match(r"^([\d\.,]+)\s*(.*)$", s)
        if match:
            num_str = match.group(1).replace(",", ".")
            unit = match.group(2).strip()
            try:
                return float(num_str), unit
            except ValueError:
                return 0.0, s
        return 0.0, s

    # Encontrar columnas auxiliares para costos y beneficios
    code_header = next((h for h in store.headers if h.lower().strip() in ['codigo', 'código', 'code', 'id']), None)
    desc_header = next((h for h in store.headers if h.lower().strip() in ['descripcion', 'descripción', 'description', 'detalle']), None)
    cost_header = next((h for h in store.headers if h.lower().strip() in ['precio unitario compra', 'precio unitario', 'precio compra', 'p.unitario', 'compra', 'costo', 'cost']), None)
    sale_header = next((h for h in store.headers if h.lower().strip() in ['precio de venta', 'precio venta', 'p.venta', 'venta', 'sale', 'price']), None)

    def parse_float_val(v):
        if v is None or v == "":
            return 0.0
        try:
            s = str(v).strip().replace("$", "").replace(" ", "")
            if "," in s and "." in s:
                s = s.replace(",", "")
            elif "," in s:
                s = s.replace(",", ".")
            return float(s)
        except Exception:
            return 0.0

    updated_rows = []
    sale_records_to_create = []

    for item in sell_in.items:
        db_row = db.query(models.StoreRow).filter(
            models.StoreRow.id == item.row_id,
            models.StoreRow.store_id == store_id
        ).first()
        
        if not db_row:
            raise HTTPException(status_code=404, detail=f"Producto con ID {item.row_id} no encontrado")
            
        old_qty = db_row.data.get(qty_header)
        n, unit = parse_qty_val(old_qty)
        
        # Calcular nueva cantidad
        new_qty = n - item.quantity
        new_qty = max(0.0, new_qty)
            
        if new_qty.is_integer():
            new_qty = int(new_qty)
            
        new_qty_str = f"{new_qty} {unit}".strip() if unit else new_qty
        
        # Guardar en data
        merged_data = db_row.data.copy()
        merged_data[qty_header] = new_qty_str
        db_row.data = merged_data
        
        updated_rows.append(db_row)

        # Extraer metadatos para la venta
        product_code = str(db_row.data.get(code_header) or "") if code_header else ""
        description = str(db_row.data.get(desc_header) or "") if desc_header else ""
        purchase_cost = parse_float_val(db_row.data.get(cost_header)) if cost_header else 0.0
        
        raw_sale = db_row.data.get(sale_header) if sale_header else 0.0
        base_sale_price = parse_float_val(raw_sale)
        
        sale_price = item.price if (item.price is not None) else base_sale_price
        profit = (sale_price - purchase_cost) * item.quantity

        db_sale = models.SaleRecord(
            store_id=store_id,
            product_code=product_code,
            description=description,
            quantity=item.quantity,
            sale_price=sale_price,
            purchase_cost=purchase_cost,
            profit=profit
        )
        sale_records_to_create.append(db_sale)
        
    try:
        # Guardar registros de venta y descontar cantidades
        for sale_rec in sale_records_to_create:
            db.add(sale_rec)
        store.updated_at = datetime.datetime.utcnow()
        db.commit()
        for r in updated_rows:
            db.refresh(r)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la venta en la base de datos: {str(e)}"
        )
        
    return updated_rows


# 9. Exportar datos de la tienda a Excel consolidado
@app.get("/api/stores/{store_id}/export")
def export_store(store_id: str, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
    rows = db.query(models.StoreRow).filter(
        models.StoreRow.store_id == store_id
    ).order_by(models.StoreRow.row_index.asc()).all()
    
    # Reconstruir los datos
    headers = store.headers
    data_list = []
    
    for row in rows:
        row_dict = {}
        for h in headers:
            row_dict[h] = row.data.get(h, None)
        data_list.append(row_dict)
        
    # Crear un DataFrame
    df = pd.DataFrame(data_list, columns=headers)
    
    # Crear el archivo Excel en memoria
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Inventario")
    
    output.seek(0)
    
    # Crear nombre de descarga
    filename = f"{store.name}_inventario.xlsx"
    
    headers_response = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    
    return StreamingResponse(
        output,
        headers=headers_response,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

# --- ENDPOINTS DEL DASHBOARD ---

@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Ventas totales e ingresos
    sales = db.query(models.SaleRecord).all()
    
    total_sales = 0.0
    total_profit = 0.0
    
    for s in sales:
        total_sales += s.sale_price * s.quantity
        total_profit += s.profit
        
    avg_margin = 0.0
    if total_sales > 0:
        avg_margin = (total_profit / total_sales) * 100.0
        
    # 2. Productos con stock bajo
    stores = db.query(models.Store).all()
    low_stock_count = 0
    
    import re
    def parse_qty_val(q):
        if q is None or q == "":
            return 0.0
        s = str(q).strip()
        match = re.match(r"^([\d\.,]+)", s)
        if match:
            num_str = match.group(1).replace(",", ".")
            try:
                return float(num_str)
            except ValueError:
                return 0.0
        return 0.0

    for store in stores:
        qty_header = next((h for h in store.headers if h.lower().strip() in ['cantidad', 'cant', 'quantity', 'qty']), None)
        if qty_header:
            rows = db.query(models.StoreRow).filter(models.StoreRow.store_id == store.id).all()
            for r in rows:
                qty_val = parse_qty_val(r.data.get(qty_header))
                if qty_val <= 5:  # Alerta si hay 5 o menos unidades
                    low_stock_count += 1
                    
    return {
        "total_sales": round(total_sales, 2),
        "total_profit": round(total_profit, 2),
        "avg_margin": round(avg_margin, 2),
        "low_stock_count": low_stock_count
    }

@app.get("/api/dashboard/top-products", response_model=List[schemas.TopProduct])
def get_top_products(db: Session = Depends(get_db)):
    sales = db.query(models.SaleRecord).all()
    
    products_map = {}
    for s in sales:
        key = s.product_code or s.description or "S/C"
        if key not in products_map:
            products_map[key] = {
                "product_code": s.product_code or "N/A",
                "description": s.description or "Sin descripción",
                "quantity_sold": 0.0,
                "total_revenue": 0.0,
                "total_profit": 0.0
            }
        products_map[key]["quantity_sold"] += s.quantity
        products_map[key]["total_revenue"] += s.sale_price * s.quantity
        products_map[key]["total_profit"] += s.profit
        
    sorted_products = sorted(products_map.values(), key=lambda x: x["total_profit"], reverse=True)
    top_10 = sorted_products[:10]
    
    for p in top_10:
        p["quantity_sold"] = round(p["quantity_sold"], 2)
        p["total_revenue"] = round(p["total_revenue"], 2)
        p["total_profit"] = round(p["total_profit"], 2)
        
    return top_10

@app.get("/api/dashboard/chart", response_model=List[schemas.ChartDataPoint])
def get_chart_data(db: Session = Depends(get_db)):
    stores = db.query(models.Store).all()
    stores_by_id = {s.id: s.name for s in stores}
    
    sales = db.query(models.SaleRecord).all()
    
    chart_map = {}
    for s in sales:
        store_name = stores_by_id.get(s.store_id, "Tienda Desconocida")
        if store_name not in chart_map:
            chart_map[store_name] = {
                "label": store_name,
                "sales": 0.0,
                "profit": 0.0
            }
        chart_map[store_name]["sales"] += s.sale_price * s.quantity
        chart_map[store_name]["profit"] += s.profit
        
    if not chart_map:
        for store_name in stores_by_id.values():
            chart_map[store_name] = {
                "label": store_name,
                "sales": 0.0,
                "profit": 0.0
            }
            
    result = list(chart_map.values())
    for r in result:
        r["sales"] = round(r["sales"], 2)
        r["profit"] = round(r["profit"], 2)
        
    return result

# 9.5. Obtener ventas por fecha local
@app.get("/api/sales/by-date")
def get_sales_by_date(date: str, tz_offset: int = 0, db: Session = Depends(get_db)):
    try:
        local_date = datetime.datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")
    
    # Calcular límites locales
    local_start = datetime.datetime(local_date.year, local_date.month, local_date.day, 0, 0, 0)
    local_end = datetime.datetime(local_date.year, local_date.month, local_date.day, 23, 59, 59, 999999)
    
    # Ajustar a UTC
    # tz_offset en JS: 300 para UTC-5. Así que UTC = Local + 300 min.
    utc_start = local_start + datetime.timedelta(minutes=tz_offset)
    utc_end = local_end + datetime.timedelta(minutes=tz_offset)
    
    # Query sales
    sales = db.query(models.SaleRecord).filter(
        models.SaleRecord.sold_at >= utc_start,
        models.SaleRecord.sold_at <= utc_end
    ).order_by(models.SaleRecord.sold_at.asc()).all()
    
    # Mapear nombres de tienda
    stores = db.query(models.Store).all()
    stores_by_id = {s.id: s.name for s in stores}
    
    result = []
    for s in sales:
        result.append({
            "id": s.id,
            "store_id": s.store_id,
            "store_name": stores_by_id.get(s.store_id, "Tienda Desconocida"),
            "product_code": s.product_code or "N/A",
            "description": s.description or "Sin descripción",
            "quantity": s.quantity,
            "sale_price": s.sale_price,
            "purchase_cost": s.purchase_cost,
            "profit": s.profit,
            "sold_at": s.sold_at.isoformat() + "Z"  # Indicar que está en UTC
        })
        
    return result

# 9.6. Obtener días activos de ventas locales
@app.get("/api/sales/active-days")
def get_active_sales_days(tz_offset: int = 0, db: Session = Depends(get_db)):
    sales_dates = db.query(models.SaleRecord.sold_at).all()
    
    active_days = set()
    for (sold_at,) in sales_dates:
        # Convertir UTC a local restando el tz_offset
        local_time = sold_at - datetime.timedelta(minutes=tz_offset)
        active_days.add(local_time.strftime("%Y-%m-%d"))
        
    return sorted(list(active_days))

# 9.7. Eliminar registro de venta y restaurar stock
@app.delete("/api/sales/{sale_id}")
def delete_sale_record(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(models.SaleRecord).filter(models.SaleRecord.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Registro de venta no encontrado")
    
    # Intentar restaurar stock en la tienda correspondiente
    store = db.query(models.Store).filter(models.Store.id == sale.store_id).first()
    if store and sale.product_code:
        qty_header = next((h for h in store.headers if h.lower().strip() in ['cantidad', 'cant', 'quantity', 'qty']), None)
        code_header = next((h for h in store.headers if h.lower().strip() in ['codigo', 'código', 'code', 'id']), None)
        
        if qty_header and code_header:
            # Buscar el producto en la tienda
            rows = db.query(models.StoreRow).filter(
                models.StoreRow.store_id == sale.store_id
            ).all()
            
            matched_row = None
            for r in rows:
                r_code = str(r.data.get(code_header) or "").strip().lower()
                if r_code == sale.product_code.strip().lower():
                    matched_row = r
                    break
            
            if matched_row:
                import re
                def parse_qty_val(q):
                    if q is None or q == "":
                        return 0.0, ""
                    s = str(q).strip()
                    match = re.match(r"^([\d\.,]+)\s*(.*)$", s)
                    if match:
                        num_str = match.group(1).replace(",", ".")
                        unit = match.group(2).strip()
                        try:
                            return float(num_str), unit
                        except ValueError:
                            return 0.0, s
                    return 0.0, s

                old_qty_str = matched_row.data.get(qty_header)
                n, unit = parse_qty_val(old_qty_str)
                
                new_qty = n + sale.quantity
                if new_qty.is_integer():
                    new_qty = int(new_qty)
                
                new_qty_str = f"{new_qty} {unit}".strip() if unit else new_qty
                
                merged_data = matched_row.data.copy()
                merged_data[qty_header] = new_qty_str
                matched_row.data = merged_data
                
                # Marcar tienda como modificada
                store.updated_at = datetime.datetime.utcnow()
    
    # Eliminar registro
    db.delete(sale)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar la venta de la base de datos: {str(e)}")
        
    return {"message": f"Registro de venta {sale_id} eliminado exitosamente y stock restaurado si correspondía."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


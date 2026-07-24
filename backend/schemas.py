from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class StoreRowBase(BaseModel):
    data: Dict[str, Any]

class StoreRowCreate(StoreRowBase):
    row_index: int

class StoreRowUpdate(StoreRowBase):
    pass

class StoreRowResponse(BaseModel):
    id: int
    store_id: str
    row_index: int
    data: Dict[str, Any]

    class Config:
        from_attributes = True

class StoreBase(BaseModel):
    name: str

class StoreCreate(BaseModel):
    name: str
    headers: List[str]

class StoreResponse(BaseModel):
    id: str
    name: str
    headers: List[str]
    row_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Respuesta detallada que contiene los datos de la tienda y sus filas (productos)
class StoreDetailResponse(BaseModel):
    info: StoreResponse
    rows: List[StoreRowResponse]

class SaleItem(BaseModel):
    row_id: int
    quantity: float
    price: float = None  # Precio al que se vendió final

class SaleRequest(BaseModel):
    items: List[SaleItem]

class DashboardStats(BaseModel):
    total_sales: float
    total_profit: float
    avg_margin: float
    low_stock_count: int

class TopProduct(BaseModel):
    product_code: str
    description: str
    quantity_sold: float
    total_revenue: float
    total_profit: float

class ChartDataPoint(BaseModel):
    label: str
    sales: float
    profit: float



class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    role: str
    store_id: Optional[str] = None

class LoginResponse(BaseModel):
    success: bool
    user: UserResponse
    message: str

class UserCreateRequest(BaseModel):
    username: str
    password: str
    role: str  # "propietario" o "vendedor"
    store_id: Optional[str] = None  # Sólo para vendedores

class UserListResponse(BaseModel):
    id: int
    username: str
    role: str
    store_id: Optional[str] = None

    class Config:
        from_attributes = True



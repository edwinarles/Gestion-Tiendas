import datetime
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, JSON, Float
from sqlalchemy.orm import relationship

from database import Base

class Store(Base):
    __tablename__ = "stores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    headers = Column(JSON, nullable=False)  # Lista de encabezados en orden original
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    rows = relationship("StoreRow", back_populates="store", cascade="all, delete-orphan", passive_deletes=True)

    @property
    def row_count(self) -> int:
        return len(self.rows)

class StoreRow(Base):
    __tablename__ = "store_rows"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    row_index = Column(Integer, nullable=False)  # Para preservar el orden
    data = Column(JSON, nullable=False)  # Diccionario key-value con los datos del producto

    store = relationship("Store", back_populates="rows")

class SaleRecord(Base):
    __tablename__ = "sale_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String, nullable=False)
    product_code = Column(String, nullable=True)
    description = Column(String, nullable=True)
    quantity = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=False)
    purchase_cost = Column(Float, nullable=False)
    profit = Column(Float, nullable=False)
    sold_at = Column(DateTime, default=datetime.datetime.utcnow)


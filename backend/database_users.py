import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

# Cargar variables de entorno
load_dotenv()

# Usar DATABASE_USERS_URL si está definida. Si no, fallback a DATABASE_URL (para PostgreSQL remoto en Render).
# Si ninguna está definida, usar la base de datos local SQLite por defecto.
DATABASE_USERS_URL = os.getenv("DATABASE_USERS_URL") or os.getenv("DATABASE_URL") or "sqlite:///./users.db"

# Inicializar motor para base de datos de usuarios
if DATABASE_USERS_URL.startswith("sqlite"):
    users_engine = create_engine(DATABASE_USERS_URL, connect_args={"check_same_thread": False})
else:
    users_engine = create_engine(DATABASE_USERS_URL)

UsersSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=users_engine)
UsersBase = declarative_base()

class User(UsersBase):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "propietario" o "vendedor"
    store_id = Column(String, nullable=True)  # ID de la tienda asignada

def get_users_db():
    db = UsersSessionLocal()
    try:
        yield db
    finally:
        db.close()

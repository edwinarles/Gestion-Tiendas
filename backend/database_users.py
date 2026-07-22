from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_USERS_URL = "sqlite:///./users.db"

# Inicializar motor para base de datos de usuarios
users_engine = create_engine(DATABASE_USERS_URL, connect_args={"check_same_thread": False})
UsersSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=users_engine)
UsersBase = declarative_base()

class User(UsersBase):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "propietario" o "vendedor"

def get_users_db():
    db = UsersSessionLocal()
    try:
        yield db
    finally:
        db.close()

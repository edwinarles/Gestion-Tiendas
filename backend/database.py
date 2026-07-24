import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cargar variables de entorno
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/excel_db")
IS_SQLITE = False

# Intentar verificar y conectar a PostgreSQL
if "postgresql" in DATABASE_URL:
    try:
        # Intentar una conexión de prueba directa a la base de datos configurada
        test_engine = create_engine(DATABASE_URL)
        with test_engine.connect() as conn:
            pass
        test_engine.dispose()
        print("Conexión a base de datos PostgreSQL establecida con éxito.")
    except Exception as direct_error:
        # Si no conecta directamente, intentamos crearla (útil para desarrollo local)
        try:
            from sqlalchemy.engine.url import make_url
            url = make_url(DATABASE_URL)
            db_name = url.database
            
            # Conexión temporal a base de datos de administración 'postgres'
            admin_url = url.set(database="postgres")
            admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
            
            with admin_engine.connect() as conn:
                result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
                exists = result.scalar()
                if not exists:
                    conn.execute(text(f"CREATE DATABASE \"{db_name}\""))
                    print(f"Base de datos PostgreSQL '{db_name}' creada con éxito.")
            admin_engine.dispose()
        except Exception as e:
            # Si es base de datos remota (por ejemplo en Neon o Render), no debemos caer en SQLite silenciosamente
            # para evitar la pérdida de persistencia de datos. Intentamos usar la DATABASE_URL provista.
            is_local = "localhost" in DATABASE_URL or "127.0.0.1" in DATABASE_URL
            if is_local:
                print("\n" + "="*80)
                print("AVISO: No se pudo conectar a PostgreSQL local usando las credenciales por defecto.")
                print("Usaremos una base de datos local SQLite (excel_db.db) temporalmente para que la app funcione.")
                print("Si prefieres usar PostgreSQL, actualiza la contraseña correcta en: backend/.env")
                print("="*80 + "\n")
                DATABASE_URL = "sqlite:///./excel_db.db"
                IS_SQLITE = True
            else:
                print(f"\nAviso: No se pudo verificar o crear la base de datos remota de forma automática ({e}).")
                print("Se procederá con la conexión directa a la URL especificada de PostgreSQL.\n")

# Inicializar motor de base de datos
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    IS_SQLITE = True
else:
    engine = create_engine(DATABASE_URL)

# Forzar soporte de claves foráneas en SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if IS_SQLITE:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

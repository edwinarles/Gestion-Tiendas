import hashlib

def hash_password(password: str) -> str:
    """Aplica hashing SHA-256 con sal para almacenamiento de contraseña."""
    salt = "excel_store_salt_123"
    db_val = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return db_val

def verify_password(password: str, hashed: str) -> bool:
    """Verifica si la contraseña ingresada coincide con la guardada."""
    return hash_password(password) == hashed

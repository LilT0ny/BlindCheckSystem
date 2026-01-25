from cryptography.fernet import Fernet
from passlib.context import CryptContext
from config import settings
import base64
import hashlib

# Contexto para hashing de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Generar clave de cifrado desde la clave de configuración
def get_encryption_key():
    """Genera una clave Fernet válida desde la clave de configuración"""
    key = hashlib.sha256(settings.encryption_key.encode()).digest()
    return base64.urlsafe_b64encode(key)

cipher = Fernet(get_encryption_key())

def hash_password(password: str) -> str:
    """Hashea una contraseña"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash"""
    return pwd_context.verify(plain_password, hashed_password)

def encrypt_data(data: str) -> str:
    """Cifra datos sensibles"""
    if not data:
        return data
    encrypted = cipher.encrypt(data.encode())
    return encrypted.decode()

def decrypt_data(encrypted_data: str) -> str:
    """Descifra datos sensibles"""
    if not encrypted_data:
        return encrypted_data
    try:
        decrypted = cipher.decrypt(encrypted_data.encode())
        return decrypted.decode()
    except Exception:
        return encrypted_data

def anonymize_name(name: str, user_id: str) -> str:
    """Anonimiza un nombre para mostrar en el sistema"""
    # Genera un hash corto del ID del usuario
    hash_obj = hashlib.md5(user_id.encode())
    hash_hex = hash_obj.hexdigest()[:6]
    return f"Usuario-{hash_hex}"

def anonymize_profesor(profesor_name: str, profesor_id: str) -> str:
    """Anonimiza el nombre de un profesor"""
    hash_obj = hashlib.md5(profesor_id.encode())
    hash_hex = hash_obj.hexdigest()[:6]
    return f"Profesor-{hash_hex}"

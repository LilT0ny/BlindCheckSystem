from cryptography.fernet import Fernet
from app.core.config import settings

# Initialize Fernet with the key from settings
fernet = Fernet(settings.DATA_ENCRYPTION_KEY)

def encrypt_data(data: str) -> str:
    """Encrypts a string and returns the url-safe base64 encoded bytes as a string."""
    if not data:
        return data
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    """Decrypts a token to its original string."""
    if not token:
        return token
    return fernet.decrypt(token.encode()).decode()

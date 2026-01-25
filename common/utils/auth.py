from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from config import settings

# Definimos el esquema OAuth2. 
# tokenUrl apunta a la ruta de login (ajustada según tu root_path /api)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un token JWT firmado"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    # Se usa la secret_key y el algoritmo definidos en tu archivo .env
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str):
    """Verifica y decodifica un token JWT. Retorna el payload o None si falla."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None

async def get_current_user(request: Request, token: Optional[str] = Depends(oauth2_scheme)):
    """
    Obtiene el usuario actual. 
    Busca el token primero en el Header (Authorization: Bearer <token>)
    y como respaldo en las Cookies.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Intentar obtener el token del Header (vía oauth2_scheme)
    final_token = token
    
    # 2. Si no hay token en el header, intentar obtenerlo de la cookie
    if not final_token:
        final_token = request.cookies.get("access_token")
    
    # 3. Si sigue sin haber token, lanzamos error 401
    if not final_token:
        raise credentials_exception
    
    # 4. Validar el token
    payload = verify_token(final_token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    role: str = payload.get("role")
    email: str = payload.get("email")
    
    if user_id is None or role is None:
        raise credentials_exception
    
    return {
        "user_id": user_id, 
        "role": role, 
        "email": email
    }

async def require_role(required_role: str):
    """Dependencia para restringir acceso a roles específicos"""
    def role_checker(current_user: Dict = Depends(get_current_user)):
        if current_user["role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere rol: {required_role}"
            )
        return current_user
    return role_checker
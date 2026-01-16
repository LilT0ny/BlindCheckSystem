from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Dict
from models.schemas import LoginRequest, TokenResponse, UserRole, CambioPasswordForzado
from database import estudiantes_collection, docentes_collection, subdecanos_collection
from utils.encryption import verify_password, decrypt_data, hash_password
from utils.auth import create_access_token, get_current_user
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """Endpoint de inicio de sesión para todos los roles"""
    
    print(f"\n🔍 DEBUG LOGIN:")
    print(f"   Email: {login_data.email}")
    print(f"   Role: {login_data.role}")
    
    # Seleccionar la colección según el rol
    if login_data.role == UserRole.ESTUDIANTE:
        collection = estudiantes_collection
    elif login_data.role == UserRole.DOCENTE:
        collection = docentes_collection
    elif login_data.role == UserRole.SUBDECANO:
        collection = subdecanos_collection
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol no válido"
        )
    
    # Buscar usuario por email
    user = await collection.find_one({"email": login_data.email})
    
    if not user:
        print(f"   ❌ Usuario NO encontrado en BD")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    print(f"   ✅ Usuario encontrado en BD")
    print(f"   Hash en BD: {user['password'][:30]}...")
    print(f"   Password ingresado: {login_data.password}")
    
    # Verificar contraseña
    password_valid = verify_password(login_data.password, user["password"])
    print(f"   Verificación password: {password_valid}")
    
    if not password_valid:
        print(f"   ❌ Password incorrecto")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    print(f"   ✅ Login exitoso\n")
    
    # Debug: verificar primer_login
    primer_login_value = user.get("primer_login", False)
    print(f"   🔍 DEBUG - primer_login en BD: {primer_login_value}")
    print(f"   🔍 DEBUG - user completo: {user}")
    
    # Crear token de acceso
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": login_data.role
        },
        expires_delta=access_token_expires
    )
    
    response_data = {
        "access_token": access_token,
        "token_type": "bearer",
        "role": login_data.role.value if hasattr(login_data.role, 'value') else str(login_data.role),
        "user_id": str(user["_id"]),
        "primer_login": primer_login_value
    }
    
    print(f"   🔍 DEBUG - Respuesta enviada: {response_data}")
    
    return response_data

@router.post("/verify-token")
async def verify_token_endpoint(current_user: Dict = Depends(lambda: None)):
    """Verifica si un token es válido"""
    return {"valid": True, "user": current_user}

@router.post("/cambiar-password-forzado")
async def cambiar_password_forzado(
    datos: CambioPasswordForzado,
    current_user: Dict = Depends(get_current_user)
):
    """Cambia la contraseña en el primer login (forzado)"""
    
    # Seleccionar la colección según el rol
    if current_user["role"] == "estudiante":
        collection = estudiantes_collection
    elif current_user["role"] == "docente":
        collection = docentes_collection
    elif current_user["role"] == "subdecano":
        collection = subdecanos_collection
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol no válido"
        )
    
    # Actualizar contraseña y marcar que ya no es primer login
    result = await collection.update_one(
        {"_id": current_user["user_id"]},
        {
            "$set": {
                "password": hash_password(datos.password_nueva),
                "primer_login": False
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {"message": "Contraseña actualizada exitosamente"}

from fastapi import APIRouter, HTTPException, Depends, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Dict
from models.schemas import LoginRequest, TokenResponse, UserRole, CambioPasswordForzado, SolicitudResetPassword
from database import estudiantes_collection, docentes_collection, subdecanos_collection, reset_password_collection
from utils.encryption import verify_password, decrypt_data, hash_password
from utils.auth import create_access_token, get_current_user
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/login", response_model=TokenResponse)

async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login para todos los roles (estudiante, docente, subdecano)
    """
    # Buscar en todas las colecciones
    user = await estudiantes_collection.find_one({"email": form_data.username})
    role = UserRole.ESTUDIANTE
    
    if not user:
        user = await docentes_collection.find_one({"email": form_data.username})
        role = UserRole.DOCENTE
        
    if not user:
        user = await subdecanos_collection.find_one({"email": form_data.username})
        role = UserRole.SUBDECANO
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar si usuario está activo (para estudiantes y docentes)
    if role in [UserRole.ESTUDIANTE, UserRole.DOCENTE] and not user.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado. Contacte al administración."
        )

    # Crear token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "role": role, "email": user["email"]},
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
async def verify_token_endpoint(current_user: Dict = Depends(get_current_user)):
    """Verifica si un token es válido"""
    return {"valid": True, "user": current_user}

@router.get("/me")
async def get_me(current_user: Dict = Depends(get_current_user)):
    """Obtiene la información del usuario actual desde el token"""
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "role": current_user["role"]
    }

@router.post("/logout")
async def logout(response: Response):
    """Cierra la sesión (borra la cookie)"""
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax"
    )
    return {"message": "Sesión cerrada exitosamente"}

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

@router.post("/solicitar-reset-password")
async def solicitar_reset_password(datos: SolicitudResetPassword):
    """Crea una solicitud de reset de contraseña"""
    from datetime import datetime
    
    # Buscar el usuario en cualquier colección
    user = None
    rol = None
    
    # Buscar en estudiantes
    user = await estudiantes_collection.find_one({"email": datos.email})
    if user:
        rol = "estudiante"
    else:
        # Buscar en docentes
        user = await docentes_collection.find_one({"email": datos.email})
        if user:
            rol = "docente"
        else:
            # Buscar en subdecanos
            user = await subdecanos_collection.find_one({"email": datos.email})
            if user:
                rol = "subdecano"
    
    if not user:
        # No revelar si el email existe o no (seguridad)
        return {"message": "Si el email existe, se enviará una solicitud al subdecano"}
    
    # Verificar si ya existe una solicitud pendiente
    solicitud_pendiente = await reset_password_collection.find_one({
        "email": datos.email,
        "estado": "pendiente"
    })
    
    if solicitud_pendiente:
        return {"message": "Ya existe una solicitud pendiente para este email"}
    
    # Crear solicitud de reset
    solicitud = {
        "email": datos.email,
        "user_id": str(user["_id"]),
        "rol": rol,
        "estado": "pendiente",
        "fecha_solicitud": datetime.utcnow(),
        "fecha_completacion": None,
        "password_temporal": None
    }
    
    result = await reset_password_collection.insert_one(solicitud)
    
    return {
        "message": "Solicitud enviada al subdecano. Contacte al administrador para obtener una nueva contraseña.",
        "solicitud_id": str(result.inserted_id)
    }

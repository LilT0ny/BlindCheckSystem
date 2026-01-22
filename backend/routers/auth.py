from fastapi import APIRouter, HTTPException, Depends, status, Response, Request

from datetime import timedelta
from typing import Dict
from models.schemas import LoginRequest, LoginResponse, UserRole, CambioPasswordForzado, SolicitudResetPassword
from database import estudiantes_collection, docentes_collection, subdecanos_collection, reset_password_collection
from utils.limiter import limiter
from utils.encryption import verify_password, decrypt_data, hash_password
from utils.auth import create_access_token, get_current_user
from config import settings
from utils.logger import log_action

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(login_data: LoginRequest, request: Request, response: Response):
    """Endpoint de inicio de sesión para todos los roles"""
    
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
    
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar si usuario está activo (para estudiantes y docentes)
    if login_data.role in [UserRole.ESTUDIANTE, UserRole.DOCENTE] and not user.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado. Contacte al administración."
        )

    # Crear token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user["_id"]), "role": login_data.role, "email": user["email"]},
        expires_delta=access_token_expires
    )
    
    # REGISTRAR LOG
    client_ip = request.client.host if request.client else "Unknown"
    await log_action(str(user["_id"]), login_data.role, "LOGIN", "Inicio de sesión exitoso", client_ip)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60
    )
    
    response_data = {
        "message": "Inicio de sesión exitoso",
        "role": login_data.role,
        "user_id": str(user["_id"]),
        "primer_login": user.get("primer_login", False)
    }
    
    return response_data

@router.post("/verify-token")
@limiter.limit("20/minute")
async def verify_token_endpoint(request: Request, current_user: Dict = Depends(get_current_user)):
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
@limiter.limit("3/minute")
async def solicitar_reset_password(datos: SolicitudResetPassword, request: Request):
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
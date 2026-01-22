from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ESTUDIANTE = "estudiante"
    DOCENTE = "docente"
    SUBDECANO = "subdecano"

class EstadoSolicitud(str, Enum):
    PENDIENTE = "pendiente"
    APROBADA = "aprobada"
    RECHAZADA = "rechazada"
    EN_REVISION = "en_revision"
    CALIFICADA = "calificada"

# Validador de dominio de email
def validate_blindcheck_email(email: str) -> str:
    if not email.endswith("@blindcheck.edu"):
        raise ValueError("El correo debe ser del dominio @blindcheck.edu")
    return email

# =============== MODELOS DE USUARIO ===============

class EstudianteBase(BaseModel):
    email: EmailStr
    nombre: str
    carrera: str
    
    @validator('email')
    def email_must_be_blindcheck(cls, v):
        return validate_blindcheck_email(v)

class EstudianteCreate(EstudianteBase):
    password: str

class EstudianteCreateBySubdecano(BaseModel):
    email: EmailStr
    nombre: str
    carrera: str
    materias_cursando: List[str] = []
    
    @validator('email')
    def email_must_be_blindcheck(cls, v):
        return validate_blindcheck_email(v)

class EstudianteUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    carrera: Optional[str] = None
    
    @validator('email')
    def email_must_be_blindcheck(cls, v):
        if v is not None:
            return validate_blindcheck_email(v)
        return v

class EstudianteResponse(EstudianteBase):
    id: str
    materias_cursando: List[str] = []
    fecha_registro: datetime

class DocenteBase(BaseModel):
    email: EmailStr
    nombre: str
    carrera: str
    
    @validator('email')
    def email_must_be_blindcheck(cls, v):
        return validate_blindcheck_email(v)

class DocenteCreate(DocenteBase):
    password: str
    materias: List[str] = []

class DocenteCreateBySubdecano(BaseModel):
    email: EmailStr
    nombre: str
    carrera: str
    materias: List[str] = []
    grupos_asignados: List[str] = []
    
    @validator('email')
    def email_must_be_blindcheck(cls, v):
        return validate_blindcheck_email(v)

class DocenteUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    materias: Optional[List[str]] = None
    grupos_asignados: Optional[List[str]] = None
    
    @validator('email')
    def email_must_be_blindcheck(cls, v):
        if v is not None:
            return validate_blindcheck_email(v)
        return v

class DocenteResponse(DocenteBase):
    id: str
    materias: List[str]
    grupos_asignados: List[str]
    fecha_registro: datetime

class SubdecanoBase(BaseModel):
    email: EmailStr
    nombre: str

class SubdecanoCreate(SubdecanoBase):
    password: str

class SubdecanoResponse(SubdecanoBase):
    id: str
    fecha_registro: datetime

# =============== MODELOS DE AUTENTICACIÓN ===============

    
    @validator('email')
    def email_must_be_blindcheck(cls, v):
        return validate_blindcheck_email(v)
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole

class LoginResponse(BaseModel):
    message: str = "Login successful"
    role: UserRole
    user_id: str
    primer_login: bool = False

# =============== MODELOS DE SOLICITUD ===============

class SolicitudCreate(BaseModel):
    materia_id: str
    docente_id: str
    grupo: str
    aporte: str  # Tipo de aporte: 1, 2, 3, Examen
    calificacion_actual: float
    motivo: str

class SolicitudResponse(BaseModel):
    id: str
    estudiante_id: str
    estudiante_nombre_anonimo: str
    materia_id: str
    materia_nombre: str
    docente_id: str
    docente_nombre_anonimo: str
    grupo: str
    aporte: str
    calificacion_actual: float
    motivo: str
    estado: EstadoSolicitud
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    calificacion_nueva: Optional[float] = None
    comentario_docente: Optional[str] = None
    motivo_rechazo: Optional[str] = None
    calificaciones: Optional[List[dict]] = None
    nota_final: Optional[float] = None

class SolicitudUpdateEstado(BaseModel):
    estado: EstadoSolicitud
    motivo_rechazo: Optional[str] = None
    docentes_asignados: Optional[List[str]] = None

# =============== MODELOS DE CALIFICACIÓN ===============

class CalificacionCreate(BaseModel):
    solicitud_id: str
    nota: float = Field(..., ge=0, le=10)
    comentario: str

class CalificacionResponse(BaseModel):
    id: str
    solicitud_id: str
    docente_id: str
    docente_nombre_anonimo: str
    nota: float
    comentario: str
    fecha_calificacion: datetime

# =============== MODELOS DE EVIDENCIA ===============

class EvidenciaCreate(BaseModel):
    materia_id: str
    grupo: str
    aporte: str  # examen, trabajo, deber, etc.
    descripcion: str
    archivo_url: str

class EvidenciaResponse(BaseModel):
    id: str
    docente_id: str
    materia_id: str
    materia_nombre: str
    grupo: str
    aporte: str
    descripcion: str
    archivo_url: str
    fecha_subida: datetime

# =============== MODELOS DE MATERIA ===============

class MateriaCreate(BaseModel):
    nombre: str
    codigo: str
    descripcion: Optional[str] = None

class MateriaResponse(BaseModel):
    id: str
    nombre: str
    codigo: str
    descripcion: Optional[str]

# =============== MODELOS DE MENSAJE ===============

class MensajeCreate(BaseModel):
    destinatario_id: str
    asunto: str
    contenido: str
    tipo: str  # notificacion, alerta, info

class MensajeResponse(BaseModel):
    id: str
    destinatario_id: str
    remitente: str
    asunto: str
    contenido: str
    tipo: str
    leido: bool
    fecha_envio: datetime

class MensajeUpdate(BaseModel):
    leido: bool

# =============== MODELOS DE CAMBIO DE CONTRASEÑA ===============

class CambioPasswordRequest(BaseModel):
    password_actual: str
    password_nueva: str 

class CambioPasswordForzado(BaseModel):
    password_nueva: str

# =============== MODELOS DE RECUPERACIÓN DE CONTRASEÑA ===============

class SolicitudResetPassword(BaseModel):
    email: EmailStr

class SolicitudResetResponse(BaseModel):
    id: str
    email: str
    rol: str
    estado: str
    fecha_solicitud: datetime
    fecha_completacion: Optional[datetime] = None

# =============== MODELOS DE LOGS ===============

class LogCreate(BaseModel):
    usuario_id: str
    rol: str
    accion: str
    detalle: Optional[str] = None
    ip: Optional[str] = None

class LogResponse(BaseModel):
    id: str
    usuario_id: str
    rol: str
    accion: str
    detalle: Optional[str]
    fecha: datetime
    ip: Optional[str]

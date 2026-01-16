from pydantic import BaseModel, EmailStr, Field
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

# =============== MODELOS DE USUARIO ===============

class EstudianteBase(BaseModel):
    email: EmailStr
    nombre: str
    carrera: str

class EstudianteCreate(EstudianteBase):
    password: str

class EstudianteCreateBySubdecano(BaseModel):
    email: EmailStr
    nombre: str
    carrera: str
    materias_cursando: List[str] = []

class EstudianteUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    carrera: Optional[str] = None

class EstudianteResponse(EstudianteBase):
    id: str
    fecha_registro: datetime

class DocenteBase(BaseModel):
    email: EmailStr
    nombre: str

class DocenteCreate(DocenteBase):
    password: str
    materias: List[str] = []

class DocenteCreateBySubdecano(BaseModel):
    email: EmailStr
    nombre: str
    carrera: str
    materias: List[str] = []
    grupos_asignados: List[str] = []

class DocenteUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    materias: Optional[List[str]] = None
    grupos_asignados: Optional[List[str]] = None

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

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
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

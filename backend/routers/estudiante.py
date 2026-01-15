from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict
from bson import ObjectId
from datetime import datetime
from models.schemas import (
    SolicitudCreate, SolicitudResponse, EstadoSolicitud,
    EstudianteUpdate, EstudianteResponse, MensajeResponse,
    CalificacionResponse
)
from database import (
    solicitudes_collection, estudiantes_collection, 
    mensajes_collection, materias_collection, calificaciones_collection,
    docentes_collection
)
from utils.auth import get_current_user
from utils.encryption import anonymize_name, anonymize_profesor

router = APIRouter(prefix="/api/estudiante", tags=["Estudiante"])

@router.get("/perfil", response_model=EstudianteResponse)
async def get_perfil(current_user: Dict = Depends(get_current_user)):
    """Obtiene el perfil del estudiante actual"""
    if current_user["role"] != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    estudiante = await estudiantes_collection.find_one({"_id": current_user["user_id"]})
    if not estudiante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado")
    
    return EstudianteResponse(
        id=str(estudiante["_id"]),
        email=estudiante["email"],
        nombre=estudiante["nombre"],
        apellido=estudiante["apellido"],
        cedula=estudiante["cedula"],
        carrera=estudiante["carrera"],
        nivel=estudiante["nivel"],
        fecha_registro=estudiante["fecha_registro"]
    )

@router.put("/perfil", response_model=EstudianteResponse)
async def actualizar_perfil(
    datos: EstudianteUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """Actualiza los datos del estudiante"""
    if current_user["role"] != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    update_data = {k: v for k, v in datos.dict(exclude_unset=True).items()}
    
    if update_data:
        await estudiantes_collection.update_one(
            {"_id": current_user["user_id"]},
            {"$set": update_data}
        )
    
    estudiante = await estudiantes_collection.find_one({"_id": current_user["user_id"]})
    
    return EstudianteResponse(
        id=str(estudiante["_id"]),
        email=estudiante["email"],
        nombre=estudiante["nombre"],
        apellido=estudiante["apellido"],
        cedula=estudiante["cedula"],
        carrera=estudiante["carrera"],
        nivel=estudiante["nivel"],
        fecha_registro=estudiante["fecha_registro"]
    )

@router.post("/solicitudes", response_model=SolicitudResponse)
async def crear_solicitud(
    solicitud: SolicitudCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Crea una nueva solicitud de recalificación"""
    if current_user["role"] != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    # Verificar que la materia existe
    materia = await materias_collection.find_one({"_id": solicitud.materia_id})
    if not materia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materia no encontrada")
    
    # Verificar que el docente existe
    docente = await docentes_collection.find_one({"_id": solicitud.docente_id})
    if not docente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente no encontrado")
    
    # Obtener datos del estudiante para anonimización
    estudiante = await estudiantes_collection.find_one({"_id": current_user["user_id"]})
    
    nueva_solicitud = {
        "estudiante_id": current_user["user_id"],
        "estudiante_nombre_anonimo": anonymize_name(estudiante['nombre'], str(estudiante["_id"])),
        "materia_id": solicitud.materia_id,
        "docente_id": solicitud.docente_id,
        "docente_nombre_anonimo": anonymize_name(docente['nombre'], str(docente["_id"])),
        "grupo": solicitud.grupo,
        "aporte": solicitud.aporte,
        "calificacion_actual": solicitud.calificacion_actual,
        "motivo": solicitud.motivo,
        "estado": EstadoSolicitud.PENDIENTE,
        "fecha_creacion": datetime.utcnow(),
        "fecha_actualizacion": datetime.utcnow()
    }
    
    result = await solicitudes_collection.insert_one(nueva_solicitud)
    
    # Crear notificación
    await mensajes_collection.insert_one({
        "destinatario_id": current_user["user_id"],
        "remitente": "Sistema",
        "asunto": "Solicitud creada",
        "contenido": f"Tu solicitud de recalificación para {materia['nombre']} ha sido creada exitosamente y está pendiente de aprobación.",
        "tipo": "info",
        "leido": False,
        "fecha_envio": datetime.utcnow()
    })
    
    return SolicitudResponse(
        id=str(result.inserted_id),
        estudiante_id=str(nueva_solicitud["estudiante_id"]),
        estudiante_nombre_anonimo=nueva_solicitud["estudiante_nombre_anonimo"],
        materia_id=str(nueva_solicitud["materia_id"]),
        materia_nombre=materia["nombre"],
        docente_id=str(nueva_solicitud["docente_id"]),
        docente_nombre_anonimo=nueva_solicitud["docente_nombre_anonimo"],
        grupo=nueva_solicitud["grupo"],
        aporte=nueva_solicitud["aporte"],
        calificacion_actual=nueva_solicitud["calificacion_actual"],
        motivo=nueva_solicitud["motivo"],
        estado=nueva_solicitud["estado"],
        fecha_creacion=nueva_solicitud["fecha_creacion"],
        fecha_actualizacion=nueva_solicitud["fecha_actualizacion"]
    )

@router.get("/solicitudes", response_model=List[SolicitudResponse])
async def listar_solicitudes(current_user: Dict = Depends(get_current_user)):
    """Lista todas las solicitudes del estudiante"""
    if current_user["role"] != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    solicitudes = await solicitudes_collection.find(
        {"estudiante_id": current_user["user_id"]}
    ).sort("fecha_creacion", -1).to_list(length=100)
    
    resultado = []
    for sol in solicitudes:
        materia = await materias_collection.find_one({"_id": sol["materia_id"]})
        docente = await docentes_collection.find_one({"_id": sol["docente_id"]})
        
        resultado.append(SolicitudResponse(
            id=str(sol["_id"]),
            estudiante_id=str(sol["estudiante_id"]),
            estudiante_nombre_anonimo=sol.get("estudiante_nombre_anonimo", "Anónimo"),
            materia_id=str(sol["materia_id"]),
            materia_nombre=materia["nombre"] if materia else "Desconocida",
            docente_id=str(sol["docente_id"]),
            docente_nombre_anonimo=sol.get("docente_nombre_anonimo", "Anónimo"),
            grupo=sol["grupo"],
            aporte=sol["aporte"],
            calificacion_actual=sol.get("calificacion_actual", 0),
            motivo=sol.get("motivo", ""),
            estado=sol["estado"],
            fecha_creacion=sol["fecha_creacion"],
            fecha_actualizacion=sol["fecha_actualizacion"],
            calificacion_nueva=sol.get("calificacion_nueva"),
            comentario_docente=sol.get("comentario_docente"),
            motivo_rechazo=sol.get("motivo_rechazo")
        ))
    
    return resultado

@router.get("/solicitudes/{solicitud_id}", response_model=SolicitudResponse)
async def obtener_solicitud(
    solicitud_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Obtiene el detalle de una solicitud específica"""
    if current_user["role"] != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    solicitud = await solicitudes_collection.find_one({
        "_id": ObjectId(solicitud_id),
        "estudiante_id": current_user["user_id"]
    })
    
    if not solicitud:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada")
    
    materia = await materias_collection.find_one({"_id": solicitud["materia_id"]})
    
    # Obtener calificaciones
    calificaciones = []
    nota_final = None
    
    califs = await calificaciones_collection.find(
        {"solicitud_id": ObjectId(solicitud_id)}
    ).to_list(length=10)
    
    for calif in califs:
        calificaciones.append({
            "docente_anonimo": anonymize_profesor("", str(calif["docente_id"])),
            "nota": calif["nota"],
            "comentario": calif["comentario"],
            "fecha": calif["fecha_calificacion"]
        })
    
    if calificaciones:
        nota_final = sum([c["nota"] for c in calificaciones]) / len(calificaciones)
    
    return SolicitudResponse(
        id=str(solicitud["_id"]),
        estudiante_id=str(solicitud["estudiante_id"]),
        estudiante_nombre_anonimo=anonymize_name("", str(solicitud["estudiante_id"])),
        materia_id=str(solicitud["materia_id"]),
        materia_nombre=materia["nombre"] if materia else "Desconocida",
        grupo=solicitud["grupo"],
        aporte=solicitud["aporte"],
        mensaje=solicitud["mensaje"],
        evidencia_url=solicitud.get("evidencia_url"),
        estado=solicitud["estado"],
        fecha_creacion=solicitud["fecha_creacion"],
        fecha_actualizacion=solicitud["fecha_actualizacion"],
        motivo_rechazo=solicitud.get("motivo_rechazo"),
        calificaciones=calificaciones if calificaciones else None,
        nota_final=nota_final
    )

@router.get("/mensajes", response_model=List[MensajeResponse])
async def listar_mensajes(current_user: Dict = Depends(get_current_user)):
    """Lista todos los mensajes del estudiante"""
    if current_user["role"] != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    mensajes = await mensajes_collection.find(
        {"destinatario_id": current_user["user_id"]}
    ).sort("fecha_envio", -1).to_list(length=100)
    
    return [
        MensajeResponse(
            id=str(msg["_id"]),
            destinatario_id=str(msg["destinatario_id"]),
            remitente=msg["remitente"],
            asunto=msg["asunto"],
            contenido=msg["contenido"],
            tipo=msg["tipo"],
            leido=msg["leido"],
            fecha_envio=msg["fecha_envio"]
        )
        for msg in mensajes
    ]

@router.put("/mensajes/{mensaje_id}/leer")
async def marcar_mensaje_leido(
    mensaje_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Marca un mensaje como leído"""
    if current_user["role"] != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    result = await mensajes_collection.update_one(
        {
            "_id": ObjectId(mensaje_id),
            "destinatario_id": current_user["user_id"]
        },
        {"$set": {"leido": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mensaje no encontrado")
    
    return {"message": "Mensaje marcado como leído"}

# =============== DATOS AUXILIARES ===============

@router.get("/materias")
async def obtener_materias(current_user: Dict = Depends(get_current_user)):
    """Obtiene las materias que está cursando el estudiante"""
    if current_user["role"] != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    print(f"\n📚 DEBUG MATERIAS ESTUDIANTE:")
    print(f"   Estudiante ID: {current_user['user_id']}")
    
    # Obtener el estudiante
    estudiante = await estudiantes_collection.find_one({"_id": current_user["user_id"]})
    if not estudiante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado")
    
    materias_cursando = estudiante.get("materias_cursando", [])
    print(f"   Materias cursando: {materias_cursando}")
    
    if not materias_cursando:
        print(f"   ⚠️ Estudiante no tiene materias asignadas")
        return []
    
    # Los IDs en MongoDB son strings como 'CS-301', no ObjectIds
    print(f"   IDs a buscar: {materias_cursando}")
    
    # Obtener solo las materias que está cursando
    materias = await materias_collection.find(
        {"_id": {"$in": materias_cursando}}
    ).to_list(100)
    
    print(f"   Materias encontradas: {len(materias)}")
    
    return [
        {
            "id": str(mat["_id"]),
            "nombre": mat["nombre"],
            "codigo": mat["codigo"],
            "descripcion": mat.get("descripcion", "")
        }
        for mat in materias
    ]

@router.get("/docentes")
async def obtener_docentes(current_user: Dict = Depends(get_current_user)):
    """Obtiene todos los docentes disponibles con sus materias asignadas"""
    if current_user["role"] != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    docentes = await docentes_collection.find().to_list(100)
    
    return [
        {
            "id": str(doc["_id"]),
            "nombre": doc["nombre"],
            "materias": [str(mat_id) for mat_id in doc.get("materias", [])]
        }
        for doc in docentes
    ]

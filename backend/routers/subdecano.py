from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict
from bson import ObjectId
from datetime import datetime
from models.schemas import (
    DocenteCreate, DocenteUpdate, DocenteResponse,
    EstudianteCreate, EstudianteResponse,
    SolicitudResponse, SolicitudUpdateEstado, EstadoSolicitud,
    MateriaCreate, MateriaResponse,
    DocenteCreateBySubdecano, EstudianteCreateBySubdecano
)
from database import (
    docentes_collection, estudiantes_collection, subdecanos_collection,
    solicitudes_collection, materias_collection, mensajes_collection
)
from utils.auth import get_current_user
from utils.encryption import hash_password, anonymize_name

router = APIRouter(prefix="/api/subdecano", tags=["Subdecano"])

# =============== GESTIÓN DE DOCENTES ===============

@router.post("/docentes")
async def crear_docente(
    docente: DocenteCreateBySubdecano,
    current_user: Dict = Depends(get_current_user)
):
    """Crea un nuevo docente con contraseña por defecto"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    # Verificar si ya existe
    existe = await docentes_collection.find_one({"email": docente.email})
    if existe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")
    
    # Generar ID único para el docente
    import secrets
    docente_id = f"DOC{secrets.randbelow(10000):04d}"
    while await docentes_collection.find_one({"_id": docente_id}):
        docente_id = f"DOC{secrets.randbelow(10000):04d}"
    
    # Contraseña por defecto: docente123
    password_default = "docente123"
    
    nuevo_docente = {
        "_id": docente_id,
        "email": docente.email,
        "nombre": docente.nombre,
        "password": hash_password(password_default),
        "rol": "docente",
        "carrera": docente.carrera,
        "materias": docente.materias,
        "activo": True,
        "primer_login": True,  # Debe cambiar contraseña en primer login
        "fecha_registro": datetime.utcnow()
    }
    
    await docentes_collection.insert_one(nuevo_docente)
    
    return {
        "id": docente_id,
        "email": docente.email,
        "nombre": docente.nombre,
        "carrera": docente.carrera,
        "materias": docente.materias,
        "password_temporal": password_default,
        "mensaje": "Docente creado. Debe cambiar su contraseña en el primer login."
    }

@router.get("/docentes")
async def listar_docentes(current_user: Dict = Depends(get_current_user)):
    """Lista todos los docentes"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    docentes = await docentes_collection.find().to_list(length=1000)
    
    return [
        {
            "id": str(doc["_id"]),
            "email": doc["email"],
            "nombre": doc["nombre"],
            "carrera": doc.get("carrera", ""),
            "materias": doc.get("materias", []),
            "activo": doc.get("activo", True),
            "primer_login": doc.get("primer_login", False),
            "fecha_registro": doc.get("fecha_registro")
        }
        for doc in docentes
    ]

@router.put("/docentes/{docente_id}")
async def actualizar_docente(
    docente_id: str,
    datos: DocenteCreateBySubdecano,
    current_user: Dict = Depends(get_current_user)
):
    """Actualiza las materias y datos de un docente"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    update_data = {
        "nombre": datos.nombre,
        "carrera": datos.carrera,
        "materias": datos.materias
    }
    
    result = await docentes_collection.update_one(
        {"_id": docente_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente no encontrado")
    
    return {"message": "Docente actualizado exitosamente"}

@router.delete("/docentes/{docente_id}")
async def eliminar_docente(
    docente_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Desactiva un docente"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    result = await docentes_collection.update_one(
        {"_id": docente_id},
        {"$set": {"activo": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente no encontrado")
    
    return {"message": "Docente desactivado exitosamente"}

# =============== GESTIÓN DE ESTUDIANTES ===============

@router.post("/estudiantes")
async def crear_estudiante(
    estudiante: EstudianteCreateBySubdecano,
    current_user: Dict = Depends(get_current_user)
):
    """Crea un nuevo estudiante con contraseña por defecto"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    existe = await estudiantes_collection.find_one({"email": estudiante.email})
    if existe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")
    
    # Generar ID único para el estudiante
    import secrets
    estudiante_id = f"EST{secrets.randbelow(10000):04d}"
    while await estudiantes_collection.find_one({"_id": estudiante_id}):
        estudiante_id = f"EST{secrets.randbelow(10000):04d}"
    
    # Contraseña por defecto: estudiante123
    password_default = "estudiante123"
    
    nuevo_estudiante = {
        "_id": estudiante_id,
        "email": estudiante.email,
        "nombre": estudiante.nombre,
        "password": hash_password(password_default),
        "rol": "estudiante",
        "carrera": estudiante.carrera,
        "materias_cursando": estudiante.materias_cursando,
        "activo": True,
        "primer_login": True,  # Debe cambiar contraseña en primer login
        "fecha_registro": datetime.utcnow()
    }
    
    await estudiantes_collection.insert_one(nuevo_estudiante)
    
    return {
        "id": estudiante_id,
        "email": estudiante.email,
        "nombre": estudiante.nombre,
        "carrera": estudiante.carrera,
        "materias_cursando": estudiante.materias_cursando,
        "password_temporal": password_default,
        "mensaje": "Estudiante creado. Debe cambiar su contraseña en el primer login."
    }

@router.get("/estudiantes")
async def listar_estudiantes(current_user: Dict = Depends(get_current_user)):
    """Lista todos los estudiantes"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    estudiantes = await estudiantes_collection.find().to_list(length=1000)
    
    return [
        {
            "id": str(est["_id"]),
            "email": est["email"],
            "nombre": est["nombre"],
            "carrera": est.get("carrera", ""),
            "materias_cursando": est.get("materias_cursando", []),
            "activo": est.get("activo", True),
            "primer_login": est.get("primer_login", False),
            "fecha_registro": est.get("fecha_registro")
        }
        for est in estudiantes
    ]

@router.put("/estudiantes/{estudiante_id}")
async def actualizar_estudiante(
    estudiante_id: str,
    datos: EstudianteCreateBySubdecano,
    current_user: Dict = Depends(get_current_user)
):
    """Actualiza las materias y datos de un estudiante"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    update_data = {
        "nombre": datos.nombre,
        "carrera": datos.carrera,
        "materias_cursando": datos.materias_cursando
    }
    
    result = await estudiantes_collection.update_one(
        {"_id": estudiante_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado")
    
    return {"message": "Estudiante actualizado exitosamente"}

@router.delete("/estudiantes/{estudiante_id}")
async def eliminar_estudiante(
    estudiante_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Desactiva un estudiante"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    result = await estudiantes_collection.update_one(
        {"_id": estudiante_id},
        {"$set": {"activo": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estudiante no encontrado")
    
    return {"message": "Estudiante desactivado exitosamente"}

# =============== GESTIÓN DE SOLICITUDES ===============

@router.get("/solicitudes", response_model=List[SolicitudResponse])
async def listar_solicitudes(current_user: Dict = Depends(get_current_user)):
    """Lista todas las solicitudes con datos anonimizados"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    solicitudes = await solicitudes_collection.find().sort("fecha_creacion", -1).to_list(length=1000)
    
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
            fecha_actualizacion=sol["fecha_actualizacion"]
        ))
    
    return resultado

@router.put("/solicitudes/{solicitud_id}/estado")
async def actualizar_estado_solicitud(
    solicitud_id: str,
    datos: dict,
    current_user: Dict = Depends(get_current_user)
):
    """Acepta o rechaza una solicitud"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    solicitud = await solicitudes_collection.find_one({"_id": ObjectId(solicitud_id)})
    if not solicitud:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada")
    
    estado = datos.get("estado")
    if not estado:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Estado requerido")
    
    update_data = {
        "estado": estado,
        "fecha_actualizacion": datetime.utcnow()
    }
    
    if datos.get("motivo_rechazo"):
        update_data["motivo_rechazo"] = datos["motivo_rechazo"]
    
    # Si se aprueba, asignar AUTOMÁTICAMENTE un docente aleatorio
    if estado == "aprobada":
        print(f"\n🎲 ASIGNACIÓN AUTOMÁTICA DE DOCENTE:")
        print(f"   Solicitud ID: {solicitud_id}")
        print(f"   Materia ID: {solicitud['materia_id']}")
        print(f"   Docente Original: {solicitud['docente_id']}")
        
        # Buscar TODOS los docentes disponibles (NO el docente original, Y QUE ESTÉN ACTIVOS)
        # Ya no se requiere que sea la misma materia
        import random
        docentes_disponibles = await docentes_collection.find({
            "_id": {"$ne": solicitud["docente_id"]},
            "$or": [
                {"activo": True},
                {"activo": {"$exists": False}}  # Si no tienen el campo, asumir que están activos
            ]
        }).to_list(length=100)
        
        print(f"   👥 Docentes disponibles en la carrera: {len(docentes_disponibles)}")
        
        if not docentes_disponibles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No hay otros docentes disponibles en la carrera"
            )
        
        # Seleccionar uno ALEATORIO
        docente_seleccionado = random.choice(docentes_disponibles)
        print(f"   ✅ Docente asignado aleatoriamente: {docente_seleccionado['nombre']}")
        
        update_data["docente_recalificador_id"] = docente_seleccionado["_id"]
        update_data["estado"] = "en_revision"
        update_data["fecha_asignacion"] = datetime.utcnow()
        
        # Notificar al docente recalificador
        await mensajes_collection.insert_one({
            "destinatario_id": docente_seleccionado["_id"],
            "remitente": "Sistema",
            "asunto": "Nueva recalificación asignada",
            "contenido": "Se te ha asignado automáticamente una nueva solicitud de recalificación para revisar.",
            "tipo": "notificacion",
            "leido": False,
            "fecha_envio": datetime.utcnow()
        })
    
    await solicitudes_collection.update_one(
        {"_id": ObjectId(solicitud_id)},
        {"$set": update_data}
    )
    
    # Notificar al estudiante
    if estado == "aprobada":
        mensaje_contenido = "Tu solicitud ha sido aprobada y se ha asignado automáticamente a un docente para su revisión."
    elif estado == "rechazada":
        mensaje_contenido = f"Tu solicitud ha sido rechazada. Motivo: {datos.get('motivo_rechazo', 'No especificado')}"
    else:
        mensaje_contenido = f"Tu solicitud ha sido actualizada al estado: {estado}"
    
    await mensajes_collection.insert_one({
        "destinatario_id": solicitud["estudiante_id"],
        "remitente": "Subdecano",
        "asunto": f"Actualización de solicitud - {estado}",
        "contenido": mensaje_contenido,
        "tipo": "notificacion",
        "leido": False,
        "fecha_envio": datetime.utcnow()
    })
    
    return {"message": "Estado actualizado exitosamente"}

# =============== GESTIÓN DE MATERIAS ===============

@router.post("/materias", response_model=MateriaResponse)
async def crear_materia(
    materia: MateriaCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Crea una nueva materia"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    nueva_materia = {
        **materia.dict(),
        "fecha_creacion": datetime.utcnow()
    }
    
    result = await materias_collection.insert_one(nueva_materia)
    
    return MateriaResponse(
        id=str(result.inserted_id),
        nombre=materia.nombre,
        codigo=materia.codigo,
        descripcion=materia.descripcion
    )

@router.get("/materias", response_model=List[MateriaResponse])
async def listar_materias(current_user: Dict = Depends(get_current_user)):
    """Lista todas las materias"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    materias = await materias_collection.find().to_list(length=1000)
    
    return [
        MateriaResponse(
            id=str(mat["_id"]),
            nombre=mat["nombre"],
            codigo=mat["codigo"],
            descripcion=mat.get("descripcion")
        )
        for mat in materias
    ]

# =============== ASIGNACIÓN DE DOCENTES RECALIFICADORES ===============

@router.get("/solicitudes/{solicitud_id}/docentes-disponibles")
async def obtener_docentes_disponibles(
    solicitud_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Obtiene lista de TODOS los docentes de la carrera (excluyendo el docente original)"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    # Obtener la solicitud
    solicitud = await solicitudes_collection.find_one({"_id": ObjectId(solicitud_id)})
    if not solicitud:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada")
    
    print(f"\n🔍 DEBUG DOCENTES DISPONIBLES:")
    print(f"   Solicitud ID: {solicitud_id}")
    print(f"   Materia ID: {solicitud['materia_id']}")
    print(f"   Docente Original ID: {solicitud['docente_id']}")
    
    # Buscar TODOS los docentes EXCEPTO el docente original Y QUE ESTÉN ACTIVOS
    # Ya no se requiere que tengan la misma materia asignada
    docentes = await docentes_collection.find({
        "_id": {"$ne": solicitud["docente_id"]},  # Excluir docente original
        "$or": [
            {"activo": True},
            {"activo": {"$exists": False}}  # Si no tienen el campo, asumir que están activos
        ]
    }).to_list(length=100)
    
    print(f"   👥 Docentes disponibles en la carrera: {len(docentes)}")
    
    resultado = []
    for doc in docentes:
        # Obtener nombres de las materias asignadas
        materias_nombres = []
        if doc.get("materias"):
            for materia_id_str in doc["materias"]:
                try:
                    materia = await materias_collection.find_one({"_id": materia_id_str})
                    if materia:
                        materias_nombres.append(materia["nombre"])
                except:
                    pass
        
        resultado.append({
            "id": str(doc["_id"]),
            "nombre": doc['nombre'],
            "email": doc["email"],
            "materias": materias_nombres  # Lista de materias que dicta
        })
    
    return resultado

@router.post("/solicitudes/{solicitud_id}/asignar-docente")
async def asignar_docente_recalificador(
    solicitud_id: str,
    datos: dict,
    current_user: Dict = Depends(get_current_user)
):
    """Asigna un docente recalificador a una solicitud aprobada"""
    if current_user["role"] != "subdecano":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    docente_recalificador_id = datos.get("docente_recalificador_id")
    if not docente_recalificador_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID del docente requerido")
    
    # Obtener la solicitud
    solicitud = await solicitudes_collection.find_one({"_id": ObjectId(solicitud_id)})
    if not solicitud:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada")
    
    # Verificar que NO sea el mismo docente original
    if str(solicitud["docente_id"]) == docente_recalificador_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes asignar al mismo docente que calificó originalmente"
        )
    
    # Verificar que el docente tenga esta materia asignada
    docente = await docentes_collection.find_one({"_id": docente_recalificador_id})
    if not docente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente no encontrado")
    
    # ✅ Verificar que el docente esté ACTIVO
    if docente.get("estado") != "Activo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes asignar a un docente inactivo"
        )
    
    if str(solicitud["materia_id"]) not in docente.get("materias", []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El docente no tiene asignada esta materia"
        )
    
    # Actualizar la solicitud
    await solicitudes_collection.update_one(
        {"_id": ObjectId(solicitud_id)},
        {
            "$set": {
                "docente_recalificador_id": docente_recalificador_id,
                "estado": "en_revision",
                "fecha_asignacion": datetime.utcnow()
            }
        }
    )
    
    # Notificar al docente recalificador
    await mensajes_collection.insert_one({
        "destinatario_id": docente_recalificador_id,
        "remitente": "Subdecano",
        "asunto": "Nueva recalificación asignada",
        "contenido": f"Se te ha asignado una nueva solicitud de recalificación para revisar.",
        "tipo": "notificacion",
        "leido": False,
        "fecha_envio": datetime.utcnow()
    })
    
    # Notificar al estudiante
    await mensajes_collection.insert_one({
        "destinatario_id": solicitud["estudiante_id"],
        "remitente": "Subdecano",
        "asunto": "Docente asignado a tu solicitud",
        "contenido": "Se ha asignado un docente para recalificar tu solicitud.",
        "tipo": "notificacion",
        "leido": False,
        "fecha_envio": datetime.utcnow()
    })
    
    return {"message": "Docente asignado exitosamente"}

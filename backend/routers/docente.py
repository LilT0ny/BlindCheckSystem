from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form, Body
from typing import List, Dict
from bson import ObjectId
from datetime import datetime
import hashlib
import os
from pathlib import Path
from PIL import Image, ImageFilter, ExifTags
import io
import base64
from models.schemas import (
    DocenteUpdate, DocenteResponse,
    EvidenciaCreate, EvidenciaResponse,
    CalificacionCreate, CalificacionResponse,
    SolicitudResponse, EstadoSolicitud
)
from database import (
    docentes_collection, evidencias_collection,
    calificaciones_collection, solicitudes_collection,
    materias_collection, mensajes_collection, estudiantes_collection
)
from utils.auth import get_current_user
from utils.encryption import anonymize_name, anonymize_profesor

router = APIRouter(prefix="/api/docente", tags=["Docente"])

# Directorios para guardar evidencias
UPLOAD_DIR = Path("uploads/evidencias")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR = Path("uploads/temp")
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Función para corregir orientación EXIF
def correct_image_orientation(img):
    """Corrige la orientación de la imagen según metadatos EXIF"""
    try:
        # Obtener información EXIF
        exif = img._getexif()
        if exif is None:
            return img
        
        # Buscar el tag de orientación
        orientation_key = None
        for tag, value in ExifTags.TAGS.items():
            if value == 'Orientation':
                orientation_key = tag
                break
        
        if orientation_key is None:
            return img
            
        orientation = exif.get(orientation_key)
        
        # Aplicar rotación según orientación EXIF
        if orientation == 3:
            img = img.rotate(180, expand=True)
        elif orientation == 6:
            img = img.rotate(270, expand=True)
        elif orientation == 8:
            img = img.rotate(90, expand=True)
            
        print(f"   📐 Orientación EXIF corregida: {orientation}")
        
    except (AttributeError, KeyError, IndexError, TypeError) as e:
        # Si no hay EXIF o hay error, devolver imagen original
        print(f"   ℹ️ No se pudo leer EXIF o no tiene orientación: {e}")
        pass
    return img

# =============== PERFIL DEL DOCENTE ===============

@router.get("/perfil", response_model=DocenteResponse)
async def get_perfil(current_user: Dict = Depends(get_current_user)):
    """Obtiene el perfil del docente actual"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    docente = await docentes_collection.find_one({"_id": current_user["user_id"]})
    if not docente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente no encontrado")
    
    return DocenteResponse(
        id=str(docente["_id"]),
        email=docente["email"],
        nombre=docente["nombre"],
        materias=docente.get("materias", []),
        grupos_asignados=docente.get("grupos_asignados", []),
        fecha_registro=docente["fecha_registro"]
    )

@router.put("/perfil", response_model=DocenteResponse)
async def actualizar_perfil(
    datos: DocenteUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """Actualiza los datos del docente (excepto materias y grupos)"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    # Excluir materias y grupos de la actualización (solo el subdecano puede cambiarlos)
    update_data = {
        k: v for k, v in datos.dict(exclude_unset=True, exclude={"materias", "grupos_asignados"}).items()
    }
    
    if update_data:
        await docentes_collection.update_one(
            {"_id": current_user["user_id"]},
            {"$set": update_data}
        )
    
    docente = await docentes_collection.find_one({"_id": current_user["user_id"]})
    
    return DocenteResponse(
        id=str(docente["_id"]),
        email=docente["email"],
        nombre=docente["nombre"],
        materias=docente.get("materias", []),
        grupos_asignados=docente.get("grupos_asignados", []),
        fecha_registro=docente["fecha_registro"]
    )

# =============== GESTIÓN DE EVIDENCIAS ===============

@router.get("/materias")
async def listar_materias_asignadas(current_user: Dict = Depends(get_current_user)):
    """Lista todas las materias asignadas al docente"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    docente = await docentes_collection.find_one({"_id": current_user["user_id"]})
    if not docente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Docente no encontrado")
    
    print(f"\n📚 DEBUG MATERIAS:")
    print(f"   Docente: {docente.get('nombre')}")
    print(f"   materias en BD: {docente.get('materias', [])}")
    print(f"   Tipo: {type(docente.get('materias', []))}")
    
    materias_ids_str = docente.get("materias", [])
    if materias_ids_str:
        print(f"   Primer elemento tipo: {type(materias_ids_str[0])}")
        print(f"   Primer elemento valor: {materias_ids_str[0]}")
    
    # Los IDs en MongoDB son strings como 'CS-301', no ObjectIds
    print(f"   IDs a buscar: {materias_ids_str}")
    
    materias = await materias_collection.find(
        {"_id": {"$in": materias_ids_str}}
    ).to_list(length=100)
    
    print(f"   Materias encontradas: {len(materias)}")
    
    resultado = []
    for materia in materias:
        # Contar evidencias subidas para esta materia
        count_evidencias = await evidencias_collection.count_documents({
            "docente_id": current_user["user_id"],
            "materia_id": materia["_id"]
        })
        
        resultado.append({
            "id": str(materia["_id"]),
            "nombre": materia["nombre"],
            "codigo": materia["codigo"],
            "grupos": docente.get("grupos_asignados", []),
            "evidencias_subidas": count_evidencias
        })
    
    return resultado

@router.get("/estudiantes")
async def listar_estudiantes(current_user: Dict = Depends(get_current_user)):
    """Lista todos los estudiantes para vincular con evidencias"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    estudiantes = await estudiantes_collection.find().sort("nombre", 1).to_list(length=1000)
    
    resultado = []
    for est in estudiantes:
        resultado.append({
            "id": str(est["_id"]),
            "nombre": est["nombre"],
            "carrera": est.get("carrera", "")
        })
    
    return resultado

@router.post("/evidencias")
async def subir_evidencia(
    archivo: UploadFile = File(...),
    estudiante_id: str = Form(...),
    materia_id: str = Form(...),
    grupo: str = Form(...),
    aporte: str = Form(...),
    descripcion: str = Form(...),
    current_user: Dict = Depends(get_current_user)
):
    """Sube evidencia (foto) con nombre hasheado para mantener anonimato"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    # Verificar que el docente tenga asignada esta materia
    docente = await docentes_collection.find_one({"_id": current_user["user_id"]})
    if str(materia_id) not in docente.get("materias", []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes asignada esta materia")
    
    # Validar que sea una imagen
    if not archivo.content_type.startswith('image/'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se permiten archivos de imagen")
    
    # Generar nombre hasheado para el archivo
    # Hash basado en: docente_id + materia_id + grupo + aporte + timestamp
    hash_input = f"{current_user['user_id']}{materia_id}{grupo}{aporte}{datetime.utcnow().isoformat()}"
    file_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]
    
    # Obtener extensión del archivo original
    file_extension = os.path.splitext(archivo.filename)[1]
    hashed_filename = f"{file_hash}{file_extension}"
    
    # Guardar archivo
    file_path = UPLOAD_DIR / hashed_filename
    with open(file_path, "wb") as buffer:
        content = await archivo.read()
        buffer.write(content)
    
    # Guardar metadata en la base de datos
    materia = await materias_collection.find_one({"_id": materia_id})
    
    nueva_evidencia = {
        "estudiante_id": estudiante_id,
        "docente_id": current_user["user_id"],
        "materia_id": materia_id,
        "grupo": grupo,
        "aporte": aporte,
        "descripcion": descripcion,
        "archivo_nombre_original": archivo.filename,
        "archivo_nombre_hash": hashed_filename,
        "archivo_url": f"/uploads/evidencias/{hashed_filename}",
        "content_type": archivo.content_type,
        "fecha_subida": datetime.utcnow()
    }
    
    result = await evidencias_collection.insert_one(nueva_evidencia)
    
    return {
        "id": str(result.inserted_id),
        "message": "Evidencia subida exitosamente",
        "archivo_hash": hashed_filename,
        "materia_nombre": materia["nombre"] if materia else "Desconocida"
    }

@router.post("/evidencias/upload-temp")
async def subir_evidencia_temporal(
    archivo: UploadFile = File(...),
    estudiante_id: str = Form(...),
    materia_id: str = Form(...),
    grupo: str = Form(...),
    aporte: str = Form(...),
    current_user: Dict = Depends(get_current_user)
):
    """Sube evidencia temporal para previsualización y recorte"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    # Validar que sea una imagen
    if not archivo.content_type.startswith('image/'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se permiten archivos de imagen")
    
    # Generar ID temporal único
    temp_id = hashlib.sha256(f"{current_user['user_id']}{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
    file_extension = os.path.splitext(archivo.filename)[1]
    temp_filename = f"{temp_id}{file_extension}"
    
    # Guardar archivo temporal
    temp_path = TEMP_DIR / temp_filename
    with open(temp_path, "wb") as buffer:
        content = await archivo.read()
        buffer.write(content)
    
    return {
        "temp_id": temp_id,
        "temp_filename": temp_filename,
        "preview_url": f"/uploads/temp/{temp_filename}",
        "message": "Imagen cargada. Marca el área del nombre para recortar."
    }

@router.post("/evidencias/recortar")
async def recortar_area_y_guardar(
    datos: Dict = Body(...),
    current_user: Dict = Depends(get_current_user)
):
    """Recorta el área seleccionada y guarda la evidencia final"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    temp_filename = datos.get("temp_filename")
    estudiante_id = datos.get("estudiante_id")
    materia_id = datos.get("materia_id")
    grupo = datos.get("grupo")
    aporte = datos.get("aporte")
    descripcion = datos.get("descripcion", "")
    crop_area = datos.get("crop_area")  # {x, y, width, height}
    
    # Validar datos
    if not all([temp_filename, estudiante_id, materia_id, grupo, aporte]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Faltan datos requeridos")
    
    temp_path = TEMP_DIR / temp_filename
    if not temp_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo temporal no encontrado")
    
    try:
        # Abrir imagen
        img = Image.open(temp_path)
        
        print(f"\n📷 DEBUG PROCESAMIENTO IMAGEN:")
        print(f"   Dimensión original: {img.width}x{img.height}")
        print(f"   Formato: {img.format}")
        
        # PASO 1: Corregir orientación EXIF primero
        img = correct_image_orientation(img)
        print(f"   Dimensión después de orientación: {img.width}x{img.height}")
        
        print(f"\n✂️ DEBUG RECORTE:")
        print(f"   crop_area recibido: {crop_area}")
        print(f"   Tipo: {type(crop_area)}")
        if crop_area:
            print(f"   x: {crop_area.get('x', 'N/A')}")
            print(f"   y: {crop_area.get('y', 'N/A')}")
            print(f"   Width: {crop_area.get('width', 0)}")
            print(f"   Height: {crop_area.get('height', 0)}")
        else:
            print(f"   ⚠️ crop_area es None o vacío")
        
        # PASO 2: Si hay área para recortar
        if crop_area and crop_area.get("width", 0) > 0 and crop_area.get("height", 0) > 0:
            x = int(crop_area["x"])
            y = int(crop_area["y"])
            width = int(crop_area["width"])
            height = int(crop_area["height"])
            
            print(f"   ✅ RECORTANDO - Eliminando área seleccionada y todo arriba")
            print(f"   📏 Imagen original: {img.width}x{img.height}")
            print(f"   📐 Área seleccionada para eliminar: x={x}, y={y}, width={width}, height={height}")
            
            # Calcular desde dónde cortar: eliminar todo ARRIBA incluyendo el rectángulo
            crop_from_y = y + height
            print(f"   ✂️ Cortando desde Y={crop_from_y} hasta el final")
            print(f"   📍 Coordenadas de recorte: left=0, top={crop_from_y}, right={img.width}, bottom={img.height}")
            
            # Guardar imagen ANTES del recorte para comparar (temporal)
            temp_before = TEMP_DIR / f"before_{temp_filename}"
            img.save(temp_before)
            print(f"   💾 Imagen ANTES guardada en: {temp_before}")
            
            # Recortar imagen: (left, top, right, bottom)
            # Eliminar todo desde arriba (0) hasta el borde inferior del rectángulo
            img = img.crop((0, crop_from_y, img.width, img.height))
            
            # Guardar imagen DESPUÉS del recorte para comparar (temporal)
            temp_after = TEMP_DIR / f"after_{temp_filename}"
            img.save(temp_after)
            print(f"   💾 Imagen DESPUÉS guardada en: {temp_after}")
            
            print(f"   ✅ Recorte completado. Nueva dimensión: {img.width}x{img.height}")
        else:
            print(f"   ⚠️ NO se recortará (área vacía o width=0)")
        
        # Generar nombre hasheado final
        hash_input = f"{current_user['user_id']}{estudiante_id}{materia_id}{grupo}{aporte}{datetime.utcnow().isoformat()}"
        file_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]
        file_extension = os.path.splitext(temp_filename)[1]
        hashed_filename = f"{file_hash}{file_extension}"
        
        # Guardar imagen procesada
        final_path = UPLOAD_DIR / hashed_filename
        img.save(final_path)
        
        # Eliminar archivo temporal
        temp_path.unlink()
        
        # Obtener datos del estudiante y materia
        materia = await materias_collection.find_one({"_id": materia_id})
        
        # Generar código de vinculación único
        codigo_interno = f"{materia.get('codigo', 'MAT')[:4].upper()}-{aporte.upper()[:3]}-{file_hash[:6].upper()}"
        
        # Guardar metadata en BD
        nueva_evidencia = {
            "codigo_interno": codigo_interno,
            "estudiante_id": estudiante_id,
            "docente_id": current_user["user_id"],
            "materia_id": materia_id,
            "grupo": grupo,
            "aporte": aporte,
            "descripcion": descripcion,
            "archivo_nombre_hash": hashed_filename,
            "archivo_url": f"/uploads/evidencias/{hashed_filename}",
            "recortada": crop_area is not None and crop_area.get("width", 0) > 0,
            "fecha_subida": datetime.utcnow()
        }
        
        result = await evidencias_collection.insert_one(nueva_evidencia)
        
        return {
            "id": str(result.inserted_id),
            "codigo_interno": codigo_interno,
            "message": "Evidencia procesada y guardada exitosamente",
            "archivo_hash": hashed_filename,
            "materia_nombre": materia["nombre"] if materia else "Desconocida"
        }
        
    except Exception as e:
        # Limpiar archivo temporal en caso de error
        if temp_path.exists():
            temp_path.unlink()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al procesar imagen: {str(e)}")

@router.get("/evidencias")
async def listar_evidencias(current_user: Dict = Depends(get_current_user)):
    """Lista todas las evidencias subidas por el docente"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    evidencias = await evidencias_collection.find(
        {"docente_id": current_user["user_id"]}
    ).sort("fecha_subida", -1).to_list(length=1000)
    
    resultado = []
    for ev in evidencias:
        materia = await materias_collection.find_one({"_id": ev["materia_id"]})
        
        resultado.append({
            "id": str(ev["_id"]),
            "materia_nombre": materia["nombre"] if materia else "Desconocida",
            "grupo": ev["grupo"],
            "aporte": ev["aporte"],
            "descripcion": ev["descripcion"],
            "archivo_nombre_hash": ev["archivo_nombre_hash"],
            "archivo_url": ev["archivo_url"],
            "fecha_subida": ev["fecha_subida"],
            "codigo_interno": ev.get("codigo_interno", ""),
            "recortada": ev.get("recortada", False)
        })
    
    return resultado

# =============== RECALIFICACIONES ===============

@router.get("/recalificaciones", response_model=List[SolicitudResponse])
async def listar_recalificaciones_asignadas(current_user: Dict = Depends(get_current_user)):
    """Lista todas las solicitudes de recalificación asignadas al docente"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    print(f"\n🔄 DEBUG RECALIFICACIONES ASIGNADAS:")
    print(f"   Docente ID: {current_user['user_id']}")
    
    # Buscar solicitudes donde este docente esté asignado como RECALIFICADOR
    solicitudes = await solicitudes_collection.find({
        "docente_recalificador_id": current_user["user_id"],
        "estado": {"$in": ["en_revision", "calificada"]}
    }).sort("fecha_creacion", -1).to_list(length=1000)
    
    print(f"   Solicitudes encontradas: {len(solicitudes)}")
    
    resultado = []
    for sol in solicitudes:
        materia = await materias_collection.find_one({"_id": sol["materia_id"]})
        
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

@router.post("/recalificaciones/{solicitud_id}/calificar")
async def calificar_solicitud(
    solicitud_id: str,
    calificacion: dict,
    current_user: Dict = Depends(get_current_user)
):
    """Califica una solicitud de recalificación"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    # Verificar que la solicitud existe y está asignada a este docente como RECALIFICADOR
    solicitud = await solicitudes_collection.find_one({
        "_id": ObjectId(solicitud_id),
        "docente_recalificador_id": current_user["user_id"]
    })
    
    if not solicitud:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada o no asignada")
    
    if solicitud["estado"] not in ["en_revision"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta solicitud no puede ser calificada")
    
    # Validar nota
    nota = calificacion.get("nota")
    if nota is None or nota < 0 or nota > 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La nota debe estar entre 0 y 10")
    
    # Actualizar solicitud
    await solicitudes_collection.update_one(
        {"_id": ObjectId(solicitud_id)},
        {
            "$set": {
                "estado": "calificada",
                "calificacion_nueva": nota,
                "comentario_docente": calificacion.get("comentario", ""),
                "fecha_actualizacion": datetime.utcnow()
            }
        }
    )
    
    # Notificar al estudiante
    await mensajes_collection.insert_one({
        "destinatario_id": solicitud["estudiante_id"],
        "remitente": "Sistema",
        "asunto": "Recalificación completada",
        "contenido": f"Tu solicitud ha sido calificada. Nueva nota: {nota}",
        "tipo": "notificacion",
        "leido": False,
        "fecha_envio": datetime.utcnow()
    })
    
    return {"message": "Calificación registrada exitosamente", "nota": nota}

@router.get("/recalificaciones/{solicitud_id}/evidencia")
async def obtener_evidencia_solicitud(
    solicitud_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Obtiene la evidencia adjunta a una solicitud de recalificación"""
    if current_user["role"] != "docente":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    
    # Verificar que la solicitud existe y está asignada a este docente como recalificador
    solicitud = await solicitudes_collection.find_one({"_id": ObjectId(solicitud_id)})
    
    if not solicitud:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada")
    
    # Verificar que este docente sea el recalificador asignado
    if solicitud.get("docente_recalificador_id") != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver esta evidencia"
        )
    
    print(f"\n📎 DEBUG EVIDENCIA SOLICITUD:")
    print(f"   Solicitud ID: {solicitud_id}")
    print(f"   Docente original: {solicitud.get('docente_id')}")
    print(f"   Materia: {solicitud.get('materia_id')}")
    print(f"   Grupo: {solicitud.get('grupo')}")
    print(f"   Aporte: {solicitud.get('aporte')}")
    print(f"   Estudiante: {solicitud.get('estudiante_id')}")
    
    # Buscar TODAS las evidencias para debug
    todas_evidencias = await evidencias_collection.find({}).to_list(length=100)
    print(f"\n   📋 TODAS las evidencias en BD ({len(todas_evidencias)}):")
    for ev in todas_evidencias:
        print(f"      - ID: {ev.get('_id')}")
        print(f"        Estudiante: {ev.get('estudiante_id')}")
        print(f"        Docente: {ev.get('docente_id')}")
        print(f"        Materia: {ev.get('materia_id')}")
        print(f"        Grupo: {ev.get('grupo')}")
        print(f"        Aporte: {ev.get('aporte')}")
        print()
    
    # Buscar la evidencia del docente original para este estudiante/materia/grupo/aporte
    query = {
        "estudiante_id": solicitud.get("estudiante_id"),
        "docente_id": solicitud.get("docente_id"),
        "materia_id": solicitud.get("materia_id"),
        "grupo": solicitud.get("grupo"),
        "aporte": solicitud.get("aporte")
    }
    print(f"   🔍 Query de búsqueda: {query}")
    
    evidencia = await evidencias_collection.find_one(query)
    
    if not evidencia:
        print(f"   ❌ No se encontró evidencia con esos criterios exactos")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay evidencia asociada a esta solicitud"
        )
    
    print(f"   ✅ Evidencia encontrada: {evidencia.get('archivo_nombre_hash')}")
    
    return {
        "id": str(evidencia["_id"]),
        "archivo_url": evidencia.get("archivo_url"),
        "archivo_nombre_hash": evidencia.get("archivo_nombre_hash"),
        "descripcion": evidencia.get("descripcion"),
        "recortada": evidencia.get("recortada", False),
        "codigo_interno": evidencia.get("codigo_interno"),
        "fecha_subida": evidencia.get("fecha_subida")
    }


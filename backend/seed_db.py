import asyncio
from database import (
    subdecanos_collection,
    docentes_collection,
    estudiantes_collection,
    materias_collection
)
from passlib.context import CryptContext
from datetime import datetime
from bson import ObjectId

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def seed_data():
    print("🌱 Iniciando proceso de siembra de base de datos con nuevos formatos...")

    # ==========================================
    # 1. MATERIAS (IDs son Strings como "CS-301")
    # ==========================================
    materias_data = [
        {
            "_id": "CS-301",
            "nombre": "Estructuras de Datos",
            "codigo": "CS-301",
            "carrera": "Ingeniería de Software"
        },
        {
            "_id": "CS-302",
            "nombre": "Programación Orientada a Objetos",
            "codigo": "CS-302",
            "carrera": "Ingeniería de Software"
        },
        {
            "_id": "CS-401",
            "nombre": "Base de Datos I",
            "codigo": "CS-401",
            "carrera": "Ingeniería de Software"
        },
        {
            "_id": "CS-402",
            "nombre": "Sistemas Operativos",
            "codigo": "CS-402",
            "carrera": "Ingeniería de Software"
        },
        {
            "_id": "CS-501",
            "nombre": "Ingeniería de Software I",
            "codigo": "CS-501",
            "carrera": "Ingeniería de Software"
        }
    ]

    for materia in materias_data:
        await materias_collection.replace_one(
            {"_id": materia["_id"]}, 
            materia, 
            upsert=True
        )
        print(f"✅ Materia procesada: {materia['_id']}")

    # ==========================================
    # 2. SUBDECANO (Admin)
    # ==========================================
    # Nota: Usamos el email como clave única para buscar, pero permitimos que Mongo genere el ObjectId
    # o usamos uno específico si se desea. En el screenshot tiene un ObjectId.
    subdecano_data = {
        "email": "admin@blindcheck.edu",
        "password": pwd_context.hash("Admin2026!"),
        "nombre": "Administrador",
        "apellido": "BlindCheck",
        "cedula": "1700000001",
        "fecha_registro": datetime.utcnow()
    }
    
    # Buscamos por email para no duplicar
    existing_sub = await subdecanos_collection.find_one({"email": subdecano_data["email"]})
    if not existing_sub:
        await subdecanos_collection.insert_one(subdecano_data)
        print("✅ Subdecano creado: admin@blindcheck.edu")
    else:
        await subdecanos_collection.update_one(
            {"email": subdecano_data["email"]},
            {"$set": subdecano_data}
        )
        print("ℹ️ Subdecano actualizado: admin@blindcheck.edu")

    # ==========================================
    # 3. DOCENTE (ID String "DOC9052")
    # ==========================================
    docente_data = {
        "_id": "DOC9052",
        "email": "juan.martinez@blindcheck.edu",
        "nombre": "Juan Martinez",
        "password": pwd_context.hash("Docente2026!"),
        "rol": "docente",
        "carrera": "Ingeniería de Software",
        "materias": ["CS-301", "CS-302", "CS-401"],
        "activo": True,
        "primer_login": False,
        "fecha_registro": datetime.utcnow()
    }

    await docentes_collection.replace_one(
        {"_id": docente_data["_id"]},
        docente_data,
        upsert=True
    )
    print(f"✅ Docente procesado: {docente_data['email']} (ID: {docente_data['_id']})")

    # ==========================================
    # 4. ESTUDIANTE (ID String "EST1172")
    # ==========================================
    estudiante_data = {
        "_id": "EST1172",
        "email": "ana.torres@blindcheck.edu",
        "nombre": "Ana Torres",
        "password": pwd_context.hash("Estudiante2026!"),
        "rol": "estudiante",
        "carrera": "Ingeniería de Software",
        "materias_cursando": ["CS-301", "CS-302", "CS-401", "CS-402", "CS-501"],
        "activo": True,
        "primer_login": False,
        "fecha_registro": datetime.utcnow()
    }

    await estudiantes_collection.replace_one(
        {"_id": estudiante_data["_id"]},
        estudiante_data,
        upsert=True
    )
    print(f"✅ Estudiante procesado: {estudiante_data['email']} (ID: {estudiante_data['_id']})")

    print("🏁 Datos actualizados con éxito según los nuevos formatos.")

if __name__ == "__main__":
    asyncio.run(seed_data())

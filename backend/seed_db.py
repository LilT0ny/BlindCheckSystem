import asyncio
from database import (
    subdecanos_collection,
    docentes_collection,
    estudiantes_collection,
    materias_collection
)
from passlib.context import CryptContext
from datetime import datetime
import uuid

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def seed_data():
    print("🌱 Iniciando proceso de siembra de base de datos...")

    # 1. Crear Subdecano (Admin)
    subdecano = await subdecanos_collection.find_one({"email": "subdecano@blindcheck.com"})
    if not subdecano:
        await subdecanos_collection.insert_one({
            "id": str(uuid.uuid4()),
            "email": "subdecano@blindcheck.com",
            "nombre": "Admin Subdecano",
            "password": pwd_context.hash("Admin2026!"),
            "fecha_registro": datetime.utcnow()
        })
        print("✅ Subdecano creado: subdecano@blindcheck.com / Admin2026!")
    else:
        print("ℹ️ Subdecano ya existe.")

    # 2. Crear Docente de Prueba
    docente = await docentes_collection.find_one({"email": "docente@blindcheck.com"})
    if not docente:
        await docentes_collection.insert_one({
            "id": str(uuid.uuid4()),
            "email": "docente@blindcheck.com",
            "nombre": "Docente Prueba",
            "password": pwd_context.hash("Docente2026!"),
            "materias": ["Ingeniería de Software", "Base de Datos"],
            "grupos_asignados": ["GR1", "GR2"],
            "fecha_registro": datetime.utcnow()
        })
        print("✅ Docente creado: docente@blindcheck.com / Docente2026!")
    else:
        print("ℹ️ Docente ya existe.")

    # 3. Crear Estudiante de Prueba
    estudiante = await estudiantes_collection.find_one({"email": "estudiante@blindcheck.com"})
    if not estudiante:
        await estudiantes_collection.insert_one({
            "id": str(uuid.uuid4()),
            "email": "estudiante@blindcheck.com",
            "nombre": "Estudiante Prueba",
            "carrera": "Ingeniería en Sistemas",
            "password": pwd_context.hash("Estudiante2026!"),
            "fecha_registro": datetime.utcnow()
        })
        print("✅ Estudiante creado: estudiante@blindcheck.com / Estudiante2026!")
    else:
        print("ℹ️ Estudiante ya existe.")

    # 4. Crear Materias
    materias_data = [
        {"nombre": "Ingeniería de Software", "codigo": "ISw", "descripcion": "Fundamentos de desarrollo"},
        {"nombre": "Base de Datos", "codigo": "BD", "descripcion": "Diseño y gestión de datos"},
        {"nombre": "Redes de Computadoras", "codigo": "RED", "descripcion": "Protocolos y comunicación"},
    ]

    for materia in materias_data:
        existe = await materias_collection.find_one({"nombre": materia["nombre"]})
        if not existe:
            materia["id"] = str(uuid.uuid4())
            await materias_collection.insert_one(materia)
            print(f"✅ Materia creada: {materia['nombre']}")
        else:
            print(f"ℹ️ Materia ya existe: {materia['nombre']}")

    print("🏁 Siembra de base de datos completada.")

if __name__ == "__main__":
    asyncio.run(seed_data())

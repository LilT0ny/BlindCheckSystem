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

    print("🏁 Datos actualizados con éxito según los nuevos formatos.")

if __name__ == "__main__":
    asyncio.run(seed_data())
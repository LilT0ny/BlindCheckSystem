from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client = AsyncIOMotorClient(settings.mongodb_url)
database = client[settings.database_name]

# Colecciones
estudiantes_collection = database.get_collection("estudiantes")
docentes_collection = database.get_collection("docentes")
subdecanos_collection = database.get_collection("subdecanos")
solicitudes_collection = database.get_collection("solicitudes")
materias_collection = database.get_collection("materias")
calificaciones_collection = database.get_collection("calificaciones")
evidencias_collection = database.get_collection("evidencias")
mensajes_collection = database.get_collection("mensajes")
reset_password_collection = database.get_collection("reset_password")
logs_collection = database.get_collection("logs")

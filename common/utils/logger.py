from datetime import datetime
from database import logs_collection
from models.schemas import LogCreate

async def log_action(usuario_id: str, rol: str, accion: str, detalle: str = None, ip: str = None):
    """
    Registra una acción en la colección de logs.
    """
    try:
        log_entry = {
            "usuario_id": usuario_id,
            "rol": rol,
            "accion": accion,
            "detalle": detalle,
            "fecha": datetime.utcnow(),
            "ip": ip
        }
        await logs_collection.insert_one(log_entry)
        print(f"📝 LOG: [{rol}] {usuario_id} - {accion}")
    except Exception as e:
        print(f"❌ Error al registrar log: {e}")

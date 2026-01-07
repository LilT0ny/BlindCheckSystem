from app.core.database import get_database
from app.models.user import UserCreate, UserUpdate, UserInDB
from app.core.security import get_password_hash
from app.core.cryptography import encrypt_data, decrypt_data
from bson import ObjectId
import hashlib

async def get_user_by_email(email: str):
    db = get_database()
    # We look up by hashed email
    email_hash = hashlib.sha256(email.encode()).hexdigest()
    user_doc = await db.users.find_one({"email_hash": email_hash})
    if user_doc:
        return _map_user_from_db(user_doc)
    return None

async def create_user(user: UserCreate):
    db = get_database()
    
    # 1. Hash the password
    hashed_password = get_password_hash(user.password)
    
    # 2. Encrypt sensitive data
    full_name_enc = encrypt_data(user.full_name)
    email_enc = encrypt_data(user.email)
    
    # 3. Create indexable hash for email
    email_hash = hashlib.sha256(user.email.encode()).hexdigest()
    
    user_doc = {
        "full_name_enc": full_name_enc,
        "email_enc": email_enc,
        "email_hash": email_hash,
        "role": user.role,
        "hashed_password": hashed_password
    }
    
    result = await db.users.insert_one(user_doc)
    return await get_user(str(result.inserted_id))

async def get_user(user_id: str):
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except:
        return None
    user_doc = await db.users.find_one({"_id": oid})
    if user_doc:
        return _map_user_from_db(user_doc)
    return None

def _map_user_from_db(user_doc: dict) -> dict:
    """Helper to decrypt data before returning to application logic."""
    # Decrypt
    full_name = decrypt_data(user_doc.get("full_name_enc"))
    email = decrypt_data(user_doc.get("email_enc"))
    
    return {
        "_id": str(user_doc["_id"]),
        "full_name": full_name,
        "email": email,
        "role": user_doc["role"],
        "hashed_password": user_doc["hashed_password"]
    }

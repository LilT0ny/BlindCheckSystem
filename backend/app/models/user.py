from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

# Helper to handle ObjectId in Pydantic
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    # This will be received as plain text but encrypted in DB
    full_name: str
    email: EmailStr
    role: str # student, teacher, subdean

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    hashed_password: str
    # When stored in DB, strictly speaking full_name is encrypted text.
    # But for Pydantic serialization we usually define the shape of the data *after* decryption or *before* encryption.
    # Let's keep it abstract here.

class UserOut(UserBase):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

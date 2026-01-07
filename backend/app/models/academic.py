from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId

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

class Group(BaseModel):
    group_name: str # e.g. "GR1"
    teacher_email: str # Used to link to teacher (email is stable)
    # in DB we might store teacher_id (ObjectId), but for input email is easier to reference
    
class SubjectBase(BaseModel):
    name: str # e.g. "Matematica"
    code: str # e.g. "MAT101"

class SubjectCreate(SubjectBase):
    groups: List[Group] = []

class SubjectUpdate(BaseModel):
    groups: Optional[List[Group]] = None

class SubjectOut(SubjectBase):
    id: str = Field(..., alias="_id")
    groups: List[Group]

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

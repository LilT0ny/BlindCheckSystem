from typing import List, Optional
from datetime import datetime
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

class RequestHistory(BaseModel):
    timestamp: datetime
    action: str
    actor_role: str # e.g. "Student", "Subdean"
    # Actor name is anonymous here? Or we store it but front-end masks it. 
    # Store masked/role is safer for "Student View".

class RequestCreate(BaseModel):
    subject_code: str # e.g. "MAT101"
    group_name: str
    component: str # "Examen"
    reason: str # The message (will be encrypted)
    evidence_url: Optional[str] = None # Or uploaded path

class RequestUpdateStatus(BaseModel):
    status: str # ACCEPTED, REJECTED
    reason: Optional[str] = None # Rejection reason

class RequestGrade(BaseModel):
    new_grade: float
    comment: str # Will be encrypted

class RequestOut(BaseModel):
    id: str = Field(..., alias="_id")
    subject_code: str
    group_name: str
    component: str
    status: str
    
    # Anonymized or Decrypted fields depending on viewer
    reason: Optional[str] = None # Student sees clear, Teacher sees clear?
    evidence_url: Optional[str] = None
    
    # Grades
    grade_original: Optional[float] = None # TBD if we fetch this
    grade_new: Optional[float] = None
    grade_average: Optional[float] = None
    
    teacher_comment: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    created_at: datetime
    history: List[RequestHistory] = []

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}

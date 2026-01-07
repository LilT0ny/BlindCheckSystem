from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.academic import SubjectCreate, SubjectOut, SubjectUpdate
from app.core.database import get_database
from app.dependencies import get_current_active_subdean, get_current_user, get_current_teacher
from app.models.user import UserOut
from app.core.logging import audit_log
from bson import ObjectId

router = APIRouter()

@router.post("/subjects", response_model=SubjectOut, dependencies=[Depends(get_current_active_subdean)])
async def create_subject(subject: SubjectCreate, current_user: UserOut = Depends(get_current_user)):
    db = get_database()
    # Check if exists
    existing = await db.subjects.find_one({"code": subject.code})
    if existing:
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    doc = subject.dict()
    result = await db.subjects.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    
    audit_log(actor=current_user.email, action="CREATE_SUBJECT", resource=subject.code)
    return doc

@router.get("/subjects", response_model=List[SubjectOut])
async def list_subjects(current_user: UserOut = Depends(get_current_user)):
    # All authenticated users can see subjects? 
    # Student needs to see to select.
    # Teacher needs to see what they have.
    # Subdean needs to manage.
    db = get_database()
    subjects = await db.subjects.find().to_list(1000)
    for s in subjects:
        s["_id"] = str(s["_id"])
    return subjects

@router.put("/subjects/{subject_id}", response_model=SubjectOut, dependencies=[Depends(get_current_active_subdean)])
async def update_subject(subject_id: str, update: SubjectUpdate, current_user: UserOut = Depends(get_current_user)):
    db = get_database()
    result = await db.subjects.update_one(
        {"_id": ObjectId(subject_id)},
        {"$set": update.dict(exclude_unset=True)}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found or no change")
    
    audit_log(actor=current_user.email, action="UPDATE_SUBJECT", resource=subject_id)
    updated_doc = await db.subjects.find_one({"_id": ObjectId(subject_id)})
    updated_doc["_id"] = str(updated_doc["_id"])
    return updated_doc

@router.get("/my-subjects", response_model=List[SubjectOut])
async def get_teacher_subjects(current_user: UserOut = Depends(get_current_teacher)):
    """
    Get subjects where the teacher is assigned to at least one group.
    """
    db = get_database()
    # Find subjects where groups.teacher_email == current_user.email
    subjects = await db.subjects.find({"groups.teacher_email": current_user.email}).to_list(1000)
    for s in subjects:
        s["_id"] = str(s["_id"])
    return subjects

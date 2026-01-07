from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.models.request import RequestCreate, RequestOut, RequestGrade, RequestUpdateStatus, RequestHistory
from app.models.user import UserOut
from app.core.database import get_database
from app.dependencies import get_current_user, get_current_active_subdean, get_current_teacher, get_current_student
from app.core.cryptography import encrypt_data, decrypt_data
from app.core.logging import audit_log
from bson import ObjectId

router = APIRouter()

# Helper to map DB doc to Output Schema
def map_request(doc: dict, viewer_role: str, viewer_id: str) -> dict:
    # Decrypt fields
    reason = decrypt_data(doc.get("reason_enc"))
    comment = decrypt_data(doc.get("teacher_comment_enc"))
    
    # Anonymization / Visibility Logic
    
    # Student sees their own reason, comment, grades.
    # Teacher sees reason, but maybe not student name (not in schema anyway).
    # Subdean sees reason, comment.
    
    # Calculate average if both grades exist
    # For now assumming original grade is somehow known or passed. 
    # Let's say we don't have original grade in DB yet, but let's pass new_grade as final.
    
    return {
        "_id": str(doc["_id"]),
        "subject_code": doc["subject_code"],
        "group_name": doc["group_name"],
        "component": doc["component"],
        "status": doc["status"],
        "reason": reason,
        "evidence_url": doc.get("evidence_url"),
        "grade_new": doc.get("grade_new"),
        "teacher_comment": comment,
        "rejection_reason": doc.get("rejection_reason"),
        "created_at": doc["created_at"],
        "history": doc.get("history", [])
    }

@router.post("/", response_model=RequestOut, dependencies=[Depends(get_current_student)])
async def create_request(
    request: RequestCreate, 
    current_user: UserOut = Depends(get_current_user)
):
    db = get_database()
    
    # Encrypt reason
    reason_enc = encrypt_data(request.reason)
    
    new_request = {
        "student_id": ObjectId(current_user.id),
        "subject_code": request.subject_code,
        "group_name": request.group_name,
        "component": request.component,
        "reason_enc": reason_enc,
        "evidence_url": request.evidence_url,
        "status": "PENDING",
        "created_at": datetime.utcnow(),
        "history": [{
            "timestamp": datetime.utcnow(),
            "action": "CREATED",
            "actor_role": "Student"
        }]
    }
    
    result = await db.requests.insert_one(new_request)
    new_request["_id"] = result.inserted_id
    
    audit_log(actor=current_user.email, action="CREATE_REQUEST", resource=str(result.inserted_id))
    return map_request(new_request, current_user.role, current_user.id)

@router.get("/me", response_model=List[RequestOut])
async def get_my_requests(current_user: UserOut = Depends(get_current_student)):
    db = get_database()
    requests = await db.requests.find({"student_id": ObjectId(current_user.id)}).to_list(100)
    return [map_request(r, current_user.role, current_user.id) for r in requests]

@router.get("/pending", response_model=List[RequestOut], dependencies=[Depends(get_current_active_subdean)])
async def get_all_requests_subdean(current_user: UserOut = Depends(get_current_user)):
    """Subdean sees all requests to Accept/Reject. Identity is hidden."""
    db = get_database()
    requests = await db.requests.find().to_list(100)
    return [map_request(r, current_user.role, current_user.id) for r in requests]

@router.put("/{request_id}/status", response_model=RequestOut, dependencies=[Depends(get_current_active_subdean)])
async def update_status_subdean(
    request_id: str, 
    status_update: RequestUpdateStatus,
    current_user: UserOut = Depends(get_current_user)
):
    db = get_database()
    
    update_data = {
        "status": status_update.status, # ACCEPTED/REJECTED
        "request_status_updated_at": datetime.utcnow()
    }
    
    if status_update.reason:
        update_data["rejection_reason"] = status_update.reason
        
    db.requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": update_data,
            "$push": {"history": {
                "timestamp": datetime.utcnow(),
                "action": status_update.status,
                "actor_role": "Subdean"
            }}
        }
    )
    
    audit_log(actor=current_user.email, action=f"STATUS_{status_update.status}", resource=request_id)
    doc = await db.requests.find_one({"_id": ObjectId(request_id)})
    return map_request(doc, current_user.role, current_user.id)

@router.put("/{request_id}/grade", response_model=RequestOut, dependencies=[Depends(get_current_teacher)])
async def grade_request(
    request_id: str,
    grade_data: RequestGrade,
    current_user: UserOut = Depends(get_current_user)
):
    db = get_database()
    # Verify assignment? We skip specific assignment logic for brevity, 
    # assuming any teacher can grade if they have the ID (or we check Payload)
    
    comment_enc = encrypt_data(grade_data.comment)
    
    db.requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "GRADED",
                "grade_new": grade_data.new_grade,
                "teacher_comment_enc": comment_enc,
                "graded_at": datetime.utcnow()
            },
            "$push": {"history": {
                "timestamp": datetime.utcnow(),
                "action": "GRADED",
                "actor_role": "Teacher" # Anonymized
            }}
        }
    )
    
    audit_log(actor=current_user.email, action="GRADED_REQUEST", resource=request_id)
    doc = await db.requests.find_one({"_id": ObjectId(request_id)})
    return map_request(doc, current_user.role, current_user.id)

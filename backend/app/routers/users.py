from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import UserCreate, UserOut, UserUpdate
from app.crud.user import create_user, get_user_by_email
from app.dependencies import get_current_active_subdean, get_current_user
from app.core.logging import audit_log

router = APIRouter()

@router.post("/", response_model=UserOut, dependencies=[Depends(get_current_active_subdean)])
async def create_new_user(user: UserCreate, current_user: UserOut = Depends(get_current_user)):
    """
    Create a new user. Only Subdean can do this.
    """
    db_user = await get_user_by_email(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = await create_user(user)
    audit_log(actor=current_user.email, action="CREATE_USER", resource=new_user["email"], details=f"Created role {user.role}")
    return new_user

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: UserOut = Depends(get_current_user)):
    return current_user

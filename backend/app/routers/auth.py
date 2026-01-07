from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password
from app.core.config import settings
from app.crud.user import get_user_by_email
from app.core.logging import audit_log

router = APIRouter()

@router.post("/token", tags=["auth"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user_by_email(form_data.username) # OAuth2 form sends username/password
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        audit_log(actor="Unknown", action="LOGIN_FAILED", resource=form_data.username, details="Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    audit_log(actor=user["email"], action="LOGIN_SUCCESS", resource="System", details=f"User {user['role']} logged in")
    return {"access_token": access_token, "token_type": "bearer"}

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.core.config import settings
from app.crud.user import get_user_by_email
from app.models.user import UserOut

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await get_user_by_email(email)
    if user is None:
        raise credentials_exception
        
    return UserOut(**user)

async def get_current_active_subdean(current_user: UserOut = Depends(get_current_user)):
    if current_user.role != "subdean":
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return current_user

async def get_current_student(current_user: UserOut = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return current_user

async def get_current_teacher(current_user: UserOut = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return current_user

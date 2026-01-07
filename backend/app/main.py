from fastapi import FastAPI
from app.routers import auth, users, academic, requests
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

app.include_router(auth.router)
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(academic.router, prefix="/academic", tags=["academic"])
app.include_router(requests.router, prefix="/requests", tags=["requests"])

@app.get("/")
def read_root():
    return {"message": "Welcome to BlindCheck Secure API"}

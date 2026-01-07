from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers import auth, users, academic, requests
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.config import settings
import os

app = FastAPI(title=settings.PROJECT_NAME)

app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

app.include_router(auth.router)
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(academic.router, prefix="/academic", tags=["academic"])
app.include_router(requests.router, prefix="/requests", tags=["requests"])

# Mount static files (Frontend)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

@app.get("/api-health")
def read_root():
    return {"message": "Welcome to BlindCheck Secure API"}

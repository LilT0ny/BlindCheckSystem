from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import auth, estudiante, subdecano, docente
from pathlib import Path
from seed_db import seed_data

app = FastAPI(
    title="Sistema de Recalificación Anónima",
    description="API para gestión de recalificaciones académicas con anonimización",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    await seed_data()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    # Permitir todos los orígenes para evitar dolores de cabeza con CORS
    allow_origin_regex=".*", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear directorio de uploads si no existe
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Montar directorio de archivos estáticos para evidencias
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Incluir routers
app.include_router(auth.router)
app.include_router(estudiante.router)
app.include_router(subdecano.router)
app.include_router(docente.router)

@app.get("/")
async def root():
    return {
        "message": "Sistema de Recalificación Anónima API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

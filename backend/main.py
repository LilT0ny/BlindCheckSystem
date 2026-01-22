from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import auth, estudiante, subdecano, docente
from pathlib import Path
from seed_db import seed_data
from config import settings
from utils.limiter import limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request

app = FastAPI(
    title="Sistema de Recalificación Anónima",
    description="API para gestión de recalificaciones académicas con anonimización",
    version="1.0.0",
    root_path="/api"
)

@app.on_event("startup")
async def startup_event():
    await seed_data()

# Configuración de CORS
# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse({"detail": "Rate limit exceeded"}, status_code=429))
app.add_middleware(SlowAPIMiddleware)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
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

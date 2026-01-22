# Sistema de Recalificación Anónima - Backend

## Descripción
Backend del sistema de recalificación anónima desarrollado con FastAPI, MongoDB y sistema de cifrado de datos.

## Características
- **Autenticación Segura**: Cookies HttpOnly + JWT.
- **Protección**: Rate Limiting (SlowAPI) contra fuerza bruta.
- **Headers**: Middleware de seguridad (HSTS, CSP headers).
- Cifrado de contraseñas con bcrypt.
- Anonimización de usuarios.
- Base de datos MongoDB.

## Instalación

### Requisitos previos
- Python 3.9+
- MongoDB 4.4+

### Pasos de instalación

1. Crear entorno virtual:
```bash
python -m venv venv
```

2. Activar entorno virtual:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno:
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
```

5. Generar claves secretas:
```python
# En Python
import secrets
print(secrets.token_urlsafe(32))  # Para SECRET_KEY
print(secrets.token_urlsafe(32))  # Para ENCRYPTION_KEY
```

## Ejecución

### Modo desarrollo:
```bash
python main.py
```

O con uvicorn directamente:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Acceder a la documentación:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Estructura del proyecto

```
backend/
├── main.py                 # Aplicación principal
├── config.py              # Configuración
├── database.py            # Conexión a MongoDB
├── requirements.txt       # Dependencias
├── models/
│   └── schemas.py         # Modelos Pydantic
├── routers/
│   ├── auth.py           # Autenticación
│   ├── estudiante.py     # Endpoints de estudiante
│   ├── docente.py        # Endpoints de docente
│   └── subdecano.py      # Endpoints de subdecano
└── utils/
    ├── encryption.py      # Cifrado y anonimización
    └── auth.py           # Utilidades de autenticación
```

## Endpoints principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Estudiante
- `GET /api/estudiante/perfil` - Ver perfil
- `POST /api/estudiante/solicitudes` - Crear solicitud
- `GET /api/estudiante/solicitudes` - Listar solicitudes
- `GET /api/estudiante/mensajes` - Ver mensajes

### Docente
- `GET /api/docente/materias` - Ver materias asignadas
- `POST /api/docente/evidencias` - Subir evidencias
- `GET /api/docente/recalificaciones` - Ver recalificaciones asignadas
- `POST /api/docente/recalificaciones/{id}/calificar` - Calificar

### Subdecano
- `POST /api/subdecano/docentes` - Crear docente
- `POST /api/subdecano/estudiantes` - Crear estudiante
- `GET /api/subdecano/solicitudes` - Ver solicitudes
- `PUT /api/subdecano/solicitudes/{id}/estado` - Aprobar/Rechazar

## Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Datos sensibles cifrados con Fernet
- Anonimización de usuarios con hashing MD5
- Validación de roles en cada endpoint

## Base de datos

### Colecciones MongoDB:
- `estudiantes` - Datos de estudiantes
- `docentes` - Datos de docentes
- `subdecanos` - Datos de subdecanos
- `solicitudes` - Solicitudes de recalificación
- `calificaciones` - Calificaciones de docentes
- `evidencias` - Evidencias subidas por docentes
- `materias` - Catálogo de materias
- `mensajes` - Notificaciones y mensajes

## Tecnologías utilizadas
- FastAPI 0.104+
- MongoDB (Motor driver)
- Pydantic para validación
- Python-JOSE para JWT
- Passlib + Bcrypt para hashing
- Cryptography para cifrado

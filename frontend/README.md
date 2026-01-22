# Sistema de Recalificación Anónima - Frontend

## Descripción
Frontend del sistema de recalificación anónima desarrollado con React y Vite.

## Características
- Interfaz moderna con diseño elegante (Rojo, Azul, Blanco)
- Rutas protegidas por rol
- Gestión de estado con Zustand
- Comunicación con API usando Axios
- Diseño responsive

## Instalación

### Requisitos previos
- Node.js 16+
- npm o yarn

### Pasos de instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (opcional):
```bash
# Crear archivo .env si necesitas cambiar la URL de la API
VITE_API_URL=http://localhost:8000/api
```

## Ejecución

### Modo desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

### Build para producción:
```bash
npm run build
```

### Preview del build:
```bash
npm run preview
```

## Estructura del proyecto

```
frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              # Punto de entrada
    ├── App.jsx               # Componente principal con rutas
    ├── index.css             # Estilos globales
    ├── components/           # Componentes reutilizables
    │   ├── Login.jsx
    │   ├── Layout.jsx
    │   └── ProtectedRoute.jsx
    ├── pages/                # Páginas por rol
    │   ├── estudiante/
    │   │   └── EstudianteDashboard.jsx
    │   ├── docente/
    │   │   └── DocenteDashboard.jsx
    │   └── subdecano/
    │       └── SubdecanoDashboard.jsx
    ├── services/             # Servicios de API
    │   └── api.js
    └── store/                # Estado global
        └── authStore.js
```

## Roles y Funcionalidades

### Estudiante
- Ver dashboard con resumen de solicitudes
- Crear nueva solicitud de recalificación
- Ver estado de solicitudes
- Ver detalles de calificaciones (anonimizadas)
- Recibir notificaciones
- Actualizar perfil

### Docente
- Ver materias asignadas
- Subir evidencias por materia y aporte
- Ver recalificaciones asignadas
- Calificar solicitudes con nota y comentario
- Ver evidencia del estudiante
- Actualizar perfil

### Subdecano
- Ver todas las solicitudes (datos anonimizados)
- Aprobar/Rechazar solicitudes
- Asignar docentes a solicitudes
- CRUD de docentes
- CRUD de estudiantes
- Gestionar materias

## Paleta de Colores

- **Rojo Primary**: `#dc2626`
- **Azul Secondary**: `#2563eb`
- **Blanco**: `#ffffff`
- **Grises**: `#f3f4f6`, `#6b7280`, `#1f2937`

## Tecnologías Utilizadas

- React 18
- React Router DOM 6
- Vite 5
- Axios
- Zustand (State Management)

## Conexión con Backend

El frontend se comunica con el backend FastAPI a través de:

- API Base URL: `https://blindcheck.space/api` (En Prod)
- **Autenticación**: `withCredentials: true` (Cookies HttpOnly automáticas).
- Interceptores para manejo de errores (401 redirige a login).

## Características de Seguridad

- **No Storage**: No se almacenan tokens sensibles en localStorage/sessionStorage.
- **CSP**: Content Security Policy estricta configurada en Nginx.
- **HTTPS**: Comunicación encriptada forzada.
- Rutas protegidas por validación de sesión con backend.

## Próximas Funcionalidades

- Upload de archivos (evidencias)
- Paginación de listados
- Filtros y búsqueda
- Notificaciones en tiempo real
- Modo oscuro
- Multi-idioma

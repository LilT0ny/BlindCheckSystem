# Backlog de requerimientos de seguridad

**Link:** 

## Lista de todos los procesos de negocio que tiene la app

La aplicación BlindCheck contempla los siguientes procesos de negocio principales: registro y autenticación de usuarios institucionales, gestión de roles académicos (Estudiantes, Docentes y Subdecanos), carga y validación de evidencias académicas, revisión y verificación de información académica, control de accesos según rol, auditoría de acciones realizadas en el sistema y administración general de la plataforma.

## Listado de componentes de seguridad

**SISTEMA DE SEGURIDAD Y PROTECCIÓN DE DATOS: BLINDCHECK**

El sistema BlindCheck implementa un modelo de seguridad robusto basado en capas (Defense in Depth), asegurando la integridad, confidencialidad y disponibilidad de la información académica en todo momento.

### 1. Componentes de Seguridad en el Backend (FastAPI)

El núcleo del sistema gestiona la lógica de acceso y protección mediante las siguientes estrategias:

- **Gestión de Autenticación:** Se utiliza el estándar JSON Web Tokens (JWT) con un tiempo de vida de 24 horas. Las contraseñas se almacenan mediante un cifrado irreversible utilizando el algoritmo Bcrypt.
- **Control de Acceso (RBAC):** Implementación de control de acceso basado en roles, permitiendo una separación estricta de funciones entre Estudiantes, Docentes y Subdecanos.
- **Validación Estricta:**  
  - Restricción de registros exclusivamente a correos con dominio institucional `@blindcheck.edu`.  
  - Validación de esquemas de datos mediante la librería Pydantic.  
  - Filtros de carga de archivos que permiten únicamente formatos de imagen para las evidencias.
- **Protección de Datos Sensibles:**  
  - Los nombres de los archivos subidos son transformados mediante un hash SHA-256 para garantizar el anonimato.  
  - Aislamiento de metadatos del sistema de archivos y uso de variables de entorno para la protección de credenciales críticas.
- **Seguridad de Base de Datos:** Instancia de MongoDB configurada sin acceso público, con colecciones segregadas por roles y acceso restringido únicamente al servicio del backend.

### 2. Componentes de Seguridad en el Frontend (React)

La interfaz de usuario asegura que la interacción del cliente sea protegida y controlada:

- **Gestión de Sesión Activa:** Uso de `sessionStorage` para el almacenamiento de tokens, garantizando que la sesión sea única por pestaña y expire al cerrar la misma.
- **Seguridad en el Enrutamiento:** Implementación de Rutas Protegidas que verifican la autenticación y el rol del usuario antes de permitir el renderizado de cualquier componente.
- **Mecanismos de Comunicación:**  
  - Uso de interceptores para adjuntar automáticamente el token JWT en cada petición HTTP.  
  - Manejo de errores seguro que detecta estados `401 Unauthorized` para forzar un cierre de sesión automático.  
  - Validaciones en el lado del cliente para mitigar el envío de datos mal formados.

### 3. Infraestructura y Despliegue (Docker & Nginx)

La capa de infraestructura actúa como el primer escudo contra amenazas externas:

- **Cifrado de Comunicaciones (SSL/TLS):** Uso de certificados certificados por Let's Encrypt con protocolos de renovación automática y redirección forzada de tráfico HTTP hacia HTTPS.
- **Configuración de Nginx:** Actúa como un servidor proxy inverso, configurado con encabezados de seguridad (Security Headers) y optimizado para el servicio seguro de activos estáticos.
- **Contenerización:** Aislamiento total de los servicios mediante Docker. La red interna garantiza que la base de datos sea invisible para cualquier agente externo a la infraestructura del contenedor.

### 4. Flujo de Seguridad del Sistema

El proceso de seguridad sigue la siguiente arquitectura lógica:

1. **Acceso:** El usuario inicia la conexión mediante protocolo seguro HTTPS.  
2. **Validación de Capa:** Nginx valida el certificado SSL y redirige la solicitud.  
3. **Sesión:** React verifica la existencia del token; de lo contrario, solicita autenticación.  
4. **Autorización:** FastAPI valida las credenciales y emite/verifica el JWT.  
5. **Persistencia:** Solo tras la validación del rol, se permite el acceso a las colecciones en MongoDB.

### 5. Credenciales de Acceso (Entorno de Evaluación)

Para fines de revisión y auditoría del sistema, se ha configurado la siguiente cuenta administrativa:

- **Rol:** Subdecano  
- **Usuario:** admin@blindcheck.edu  
- **Contraseña:** Admin2026!

**Nota de seguridad:** Todos los usuarios del sistema deben utilizar obligatoriamente el dominio institucional `@blindcheck.edu`.

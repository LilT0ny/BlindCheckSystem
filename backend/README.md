# BlindCheck Backend

Backend seguro y anonimizado para sistema de recalificación.

## Requisitos
- Python 3.9+
- MongoDB (Running on localhost:27017)

## Instalación

1.  Crear entorno virtual (opcional pero recomendado):
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

2.  Instalar dependencias:
    ```bash
    pip install -r requirements.txt
    ```

3.  Configurar variables de entorno:
    - El archivo `.env` ya contiene configuraciones por defecto y una llave de encriptación generada.

## Inicialización

1.  **Iniciar Base de Datos**: Asegúrate de que MongoDB esté corriendo.
2.  **Seed (Datos Iniciales)**: Crea el usuario Subdecano (Admin).
    ```bash
    python seed.py
    ```
    Esto creará: `subdean@example.com` / `adminpassword`.

## Ejecución

Para iniciar el servidor de desarrollo:
```bash
uvicorn app.main:app --reload
```
La API estará disponible en `http://localhost:8000`.
Documentación interactiva: `http://localhost:8000/docs`.

## Pruebas

Para verificar el flujo completo (Login -> Crear Usuario -> Solicitud -> Recalificación):
1.  Asegúrate que el servidor esté corriendo.
2.  En otra terminal, ejecuta:
    ```bash
    python test_flow.py
    ```

## Estructura
- `app/core`: Configuración, Seguridad, Loggin, Base de datos.
- `app/models`: Esquemas Pydantic.
- `app/routers`: Endpoints de la API.
- `app/crud`: Lógica de base de datos y encriptación.

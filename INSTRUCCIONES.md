# Instrucciones para ejecutar el proyecto

## ✅ Estado del Proyecto
El proyecto está completamente configurado y listo para ejecutarse con base de datos local PostgreSQL.

## 📋 Requisitos previos verificados
- ✅ Python 3.13.5 con entorno virtual configurado
- ✅ PostgreSQL local en puerto 5432
- ✅ Node.js con dependencias instaladas
- ✅ Todas las migraciones aplicadas
- ✅ Archivos .env configurados

## 🚀 Iniciar el proyecto

### Opción 1: Usando scripts (Recomendado)

1. **Iniciar Backend:**
   ```powershell
   .\start-backend.ps1
   ```
   El backend estará disponible en: http://127.0.0.1:8000

2. **Iniciar Frontend (en otra terminal):**
   ```powershell
   .\start-frontend.ps1
   ```
   El frontend estará disponible en: http://localhost:5173

### Opción 2: Manualmente

#### Backend:
```powershell
cd BackEnd
C:/Users/Dell/Desktop/Proyecto/.venv/Scripts/python.exe manage.py runserver
```

#### Frontend:
```powershell
cd Front-End
npm run dev
```

## 🔑 Configuración actual

### Base de datos (.env del Backend):
- **Base de datos:** publications_db
- **Usuario:** postgres
- **Puerto:** 5432 (PostgreSQL local)
- **Host:** localhost

### URLs configuradas:
- **Backend API:** http://127.0.0.1:8000/api
- **Frontend:** http://localhost:5173
- **Admin Django:** http://127.0.0.1:8000/admin

## 👥 Crear usuarios

Para crear un superusuario admin:
```powershell
cd BackEnd
C:/Users/Dell/Desktop/Proyecto/.venv/Scripts/python.exe manage.py createsuperuser
```

## 📱 Roles disponibles en el sistema:
- **estudiante** - Gestiona sus publicaciones y solicitudes
- **tutor** - Revisa publicaciones de sus alumnos
- **jefe** - Aprueba/rechaza publicaciones y solicitudes
- **admin** - Acceso completo al sistema

## 🔧 Comandos útiles

### Backend:
```powershell
# Ver migraciones
python manage.py showmigrations

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Listar usuarios
python list_users.py
```

### Frontend:
```powershell
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## 📊 Endpoints principales del API

### Autenticación:
- POST `/api/token/` - Obtener token JWT
- POST `/api/token/refresh/` - Refrescar token
- POST `/api/auth/register/` - Registrar usuario
- GET `/api/auth/users/me/` - Perfil actual

### Publicaciones:
- GET/POST `/api/publications/` - Lista y crear publicaciones
- GET `/api/publications/my_publications/` - Mis publicaciones
- GET `/api/publications/pending_review/` - Pendientes de revisión
- POST `/api/publications/{id}/review/` - Revisar publicación

### Solicitudes ECE:
- GET/POST `/api/ece-requests/` - Lista y crear solicitudes
- GET `/api/ece-requests/my_requests/` - Mis solicitudes
- POST `/api/ece-requests/{id}/review/` - Revisar solicitud

## 🐛 Solución de problemas

### Error de conexión a la base de datos:
Verifica que PostgreSQL esté ejecutándose:
```powershell
Get-Service -Name postgresql*
```

### Error de puerto ocupado:
Si el puerto 8000 o 5173 está ocupado, puedes cambiarlos:
- Backend: `python manage.py runserver 8001`
- Frontend: Edita `vite.config.js`

### Error de CORS:
Verifica que el frontend esté en la lista de CORS_ALLOWED_ORIGINS en settings.py

## 📝 Notas importantes
- El archivo `.env` contiene credenciales. NO lo subas a repositorios públicos.
- Las contraseñas de usuarios deben ser seguras en producción.
- DEBUG está en True para desarrollo. Cámbialo a False en producción.
- Los archivos media se guardan en `BackEnd/media/`

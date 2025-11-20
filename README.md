# 🎓 Sistema de Gestión para la Modalidad ECE - Publicaciones

<img src="logo_web.png" alt="Logo Bot Docente" width="200">

Sistema web para la gestión de publicaciones científicas de estudiantes en la modalidad ECE (Examen de Culminación de Estudios) de la Universidad de las Ciencias Informáticas.

**Proyecto Final de Programación Web**

---

## ✅ **PROYECTO COMPLETAMENTE CONFIGURADO Y FUNCIONAL**

## 🚀 Inicio Rápido

### 1️⃣ Iniciar el Backend
```powershell
.\start-backend.ps1
```
✅ Backend corriendo en: **http://127.0.0.1:8000**

### 2️⃣ Iniciar el Frontend (en otra terminal)
```powershell
.\start-frontend.ps1
```
✅ Frontend corriendo en: **http://localhost:5173**

### 3️⃣ Acceder al Sistema
- Abre tu navegador en: **http://localhost:5173**
- Usa las credenciales de los usuarios de prueba

---

## 👥 Usuarios de Prueba

| Usuario | Rol | Funcionalidad |
|---------|-----|---------------|
| `admin` | Administrador | Gestión completa del sistema |
| `mike` | Estudiante | Gestionar publicaciones y solicitudes |

Para crear más usuarios:
```powershell
cd BackEnd
C:/Users/Dell/Desktop/Proyecto/.venv/Scripts/python.exe manage.py createsuperuser
```

---

## 🎯 Funcionalidades

### 👨‍🎓 Estudiante
- Registrar publicaciones científicas con archivos PDF
- Crear solicitudes ECE
- Ver estado de revisiones
- Gestionar perfil personal

### 👨‍🏫 Tutor
- Ver publicaciones de alumnos asignados
- Emitir opiniones sobre publicaciones
- Aprobar o solicitar revisiones

### 👔 Jefe de Departamento
- Revisar y aprobar publicaciones
- Gestionar solicitudes ECE
- Generar reportes y estadísticas

### 🔧 Administrador
- Gestión completa de usuarios
- Asignar roles y permisos
- Ver logs del sistema
- Configuración del sistema

---

## 🛠️ Tecnologías

### Backend
- Python 3.13.5
- Django 5.1.3 + Django REST Framework
- PostgreSQL (Base de datos local)
- JWT Authentication

### Frontend
- React 19.1.1
- Vite 7.1.7
- React Router + Axios
- Bootstrap 5.3.8

---

## 📂 Estructura del Proyecto

```
📦 Proyecto
├── 🔙 BackEnd/
│   ├── authentication/     # Gestión de usuarios
│   ├── publications/      # Publicaciones científicas
│   ├── requests/         # Solicitudes ECE
│   ├── config/          # Configuración Django
│   └── .env            # Variables de entorno
│
├── 🎨 Front-End/
│   ├── src/
│   │   ├── pages/         # Páginas por rol
│   │   ├── components/    # Componentes
│   │   └── services/     # Servicios API
│   └── .env            # Variables de entorno
│
├── start-backend.ps1     # Script inicio backend
├── start-frontend.ps1    # Script inicio frontend
└── INSTRUCCIONES.md     # Guía detallada
```

---

## 🔌 API Endpoints Principales

### Autenticación
```http
POST /api/token/              # Login
POST /api/token/refresh/      # Refrescar token
POST /api/auth/register/      # Registrar usuario
GET  /api/auth/users/me/      # Perfil actual
```

### Publicaciones
```http
GET  /api/publications/                # Listar
POST /api/publications/                # Crear
GET  /api/publications/my_publications/ # Mis publicaciones
POST /api/publications/{id}/review/    # Revisar
```

### Solicitudes ECE
```http
GET  /api/ece-requests/              # Listar
POST /api/ece-requests/              # Crear
GET  /api/ece-requests/my_requests/  # Mis solicitudes
POST /api/ece-requests/{id}/review/  # Revisar
```

Ver documentación completa de endpoints en `INSTRUCCIONES.md`

---

## 💾 Configuración de Base de Datos

### PostgreSQL Local
```env
DB_NAME=publications_db
DB_USER=postgres
DB_HOST=localhost
DB_PORT=5432
```

Las migraciones ya están aplicadas y la base de datos está lista para usar.

---

## 🔧 Comandos Útiles

### Backend
```powershell
# Ver usuarios
python list_users.py

# Crear superusuario
python manage.py createsuperuser

# Ver migraciones
python manage.py showmigrations

# Verificar configuración
python manage.py check
```

### Frontend
```powershell
# Modo desarrollo
npm run dev

# Build producción
npm run build
```

---

## 🔐 Seguridad

- ✅ Autenticación JWT
- ✅ CORS configurado
- ✅ Permisos basados en roles
- ✅ Validación de archivos
- ✅ Variables sensibles en .env

---

## 🐛 Solución de Problemas

### Backend no inicia
```powershell
# Verificar PostgreSQL
Get-Service -Name postgresql*

# Ver errores
python manage.py check
```

### Frontend no inicia
```powershell
# Reinstalar dependencias
npm install
```

### Error de CORS
Verifica `CORS_ALLOWED_ORIGINS` en `BackEnd/config/settings.py`

---

## 📚 Documentación

- `INSTRUCCIONES.md` - Guía completa de configuración
- `BackEnd/README.md` - Documentación del backend
- `BackEnd/PLAN_INTEGRACION.md` - Plan de integración

---

## 👨‍💻 Desarrolladores

- Maikel Ferrero Sosa
- Robertaco

Universidad de las Ciencias Informáticas (UCI)

---

## 🎉 ¡Todo listo para usar!

El proyecto está completamente configurado y funcional. Solo necesitas:

1. ✅ Ejecutar `.\start-backend.ps1`
2. ✅ Ejecutar `.\start-frontend.ps1`
3. ✅ Abrir http://localhost:5173
4. ✅ ¡Disfrutar del sistema!



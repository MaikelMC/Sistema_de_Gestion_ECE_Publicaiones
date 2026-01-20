# Plan de Integración Frontend-Backend

## ✅ PASO 1: MODELOS CREADOS

### 1.1 Authentication App (authentication/models.py)
- ✅ **User**: Modelo extendido con roles (estudiante, tutor, jefe, admin)
  - Campos: role, carrera, telefono, especialidad, grado_academico
  - Métodos: is_estudiante, is_tutor, is_jefe

### 1.2 Publications App (publications/models.py)
- ✅ **Publication**: Gestión de publicaciones científicas
  - Campos: title, authors, publication_date, journal, volume, pages, doi, abstract, file
  - Estados: en_proceso, pending, approved, rejected
  - Niveles: 1, 2, 3
  - Relaciones: student, tutor, reviewed_by

- ✅ **TutorOpinion**: Opiniones de tutores sobre publicaciones
  - Campos: opinion, recommendation (aprobada, rechazada, revision)
  - Relaciones: publication, tutor

- ✅ **TutorStudent**: Relación Tutor-Estudiante
  - Campos: assigned_date, is_active, progress
  - Relaciones: tutor, student

### 1.3 Requests App (requests/models.py)
- ✅ **ECERequest**: Solicitudes de modalidad ECE
  - Campos: file, description, status, review_comments
  - Estados: en_proceso, pendiente, aprobada, rechazada
  - Relaciones: student, reviewed_by

- ✅ **SystemLog**: Logs del sistema para administradores
  - Campos: action, model_name, object_id, description, ip_address

- ✅ **SystemConfiguration**: Configuraciones del sistema
  - Campos: key, value, description, is_active

---

## 📋 PASO 2: CREAR SERIALIZERS

### 2.1 authentication/serializers.py
```python
- UserSerializer
- UserCreateSerializer
- UserUpdateSerializer
- LoginSerializer
- ChangePasswordSerializer
```

### 2.2 publications/serializers.py
```python
- PublicationSerializer
- PublicationCreateSerializer
- PublicationDetailSerializer
- TutorOpinionSerializer
- TutorStudentSerializer
```

### 2.3 requests/serializers.py
```python
- ECERequestSerializer
- ECERequestCreateSerializer
- SystemLogSerializer
- SystemConfigurationSerializer
```

---

## 🔌 PASO 3: CREAR VIEWSETS Y VIEWS

### 3.1 authentication/views.py
```python
- UserViewSet
- LoginView
- LogoutView
- RegisterView
- ChangePasswordView
- ProfileView
```

### 3.2 publications/views.py
```python
- PublicationViewSet
- TutorOpinionViewSet
- TutorStudentViewSet
- PublicationReviewView (para jefe)
- MyPublicationsView (para estudiante)
- PendingPublicationsView (para tutor)
```

### 3.3 requests/views.py
```python
- ECERequestViewSet
- SystemLogViewSet
- SystemConfigurationViewSet
- MyRequestsView (para estudiante)
- PendingRequestsView (para jefe)
```

---

## 🛣️ PASO 4: CONFIGURAR URLS

### 4.1 authentication/urls.py
```python
/api/auth/register/
/api/auth/login/
/api/auth/logout/
/api/auth/profile/
/api/auth/change-password/
/api/auth/users/
```

### 4.2 publications/urls.py
```python
/api/publications/
/api/publications/{id}/
/api/publications/my-publications/
/api/publications/{id}/review/
/api/tutor-opinions/
/api/tutor-students/
```

### 4.3 requests/urls.py
```python
/api/ece-requests/
/api/ece-requests/{id}/
/api/ece-requests/my-requests/
/api/ece-requests/{id}/review/
/api/system-logs/
/api/system-config/
```

### 4.4 config/urls.py
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/', include('publications.urls')),
    path('api/', include('requests.urls')),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
]
```

---

## 🔐 PASO 5: CREAR PERMISOS PERSONALIZADOS

### 5.1 publications/permissions.py
```python
- IsOwnerOrReadOnly
- IsEstudiante
- IsTutor
- IsJefeDepartamento
- IsAdmin
```

---

## 🗄️ PASO 6: MIGRACIONES DE BASE DE DATOS

```bash
# Eliminar migraciones anteriores (si existen)
python manage.py migrate --fake authentication zero
python manage.py migrate --fake publications zero
python manage.py migrate --fake requests zero

# Crear nuevas migraciones
python manage.py makemigrations authentication
python manage.py makemigrations publications
python manage.py makemigrations requests

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser
```

---

## 🎨 PASO 7: FRONTEND - ESTRUCTURA DE SERVICIOS

### 7.1 Instalar dependencias
```bash
npm install axios react-toastify
```

### 7.2 Crear estructura de carpetas
```
src/
├── config/
│   └── config.js          # Configuración API_URL
├── services/
│   ├── api.js             # Configuración axios + interceptores
│   ├── authService.js     # Login, logout, register
│   ├── publicationService.js
│   ├── requestService.js
│   └── userService.js
├── utils/
│   └── helpers.js         # Funciones auxiliares
└── contexts/
    └── AuthContext.jsx    # Contexto de autenticación
```

---

## 🔄 PASO 8: MAPEO FRONTEND -> BACKEND

### 8.1 Login.jsx
```
Vista Frontend: /pages/Estudiante/Login/Login.jsx
↓
Backend Endpoint: POST /api/auth/login/
Modelo: User
Serializer: LoginSerializer
```

### 8.2 Publicaciones.jsx (Estudiante)
```
Vista Frontend: /pages/Estudiante/Publicasiones/Publicaciones.jsx
↓
Backend Endpoints:
  - GET    /api/publications/my-publications/
  - POST   /api/publications/
  - PUT    /api/publications/{id}/
  - DELETE /api/publications/{id}/
Modelo: Publication
Serializer: PublicationSerializer
```

### 8.3 Solicitud.jsx (Estudiante)
```
Vista Frontend: /pages/Estudiante/Solicitud/Solicitud.jsx
↓
Backend Endpoints:
  - GET  /api/ece-requests/my-requests/
  - POST /api/ece-requests/
Modelo: ECERequest
Serializer: ECERequestSerializer
```

### 8.4 GestionPublicaciones.jsx (Jefe)
```
Vista Frontend: /pages/JefeDepartamento/GestionPublicasiones/
↓
Backend Endpoints:
  - GET  /api/publications/?status=pending
  - POST /api/publications/{id}/review/
Modelo: Publication
Acción: Aprobar/Rechazar
```

### 8.5 GestionSolicitud.jsx (Jefe)
```
Vista Frontend: /pages/JefeDepartamento/GestionSolicitud/
↓
Backend Endpoints:
  - GET  /api/ece-requests/?status=pendiente
  - POST /api/ece-requests/{id}/review/
Modelo: ECERequest
Acción: Aprobar/Rechazar
```

### 8.6 MisAlumnos.jsx (Tutor)
```
Vista Frontend: /pages/Tutor/MisAlumnos/
↓
Backend Endpoints:
  - GET /api/tutor-students/?tutor={user_id}
Modelo: TutorStudent
```

### 8.7 OpinionesTutor.jsx (Tutor)
```
Vista Frontend: /pages/Tutor/OpinionesTutor/
↓
Backend Endpoints:
  - GET  /api/publications/?status=pending&tutor={user_id}
  - POST /api/tutor-opinions/
Modelo: TutorOpinion
```

### 8.8 GestionUsuarios.jsx (Admin)
```
Vista Frontend: /pages/Admin/GestionUsuarios/
↓
Backend Endpoints:
  - GET    /api/auth/users/
  - POST   /api/auth/users/
  - PUT    /api/auth/users/{id}/
  - DELETE /api/auth/users/{id}/
Modelo: User
```

---

## 📊 PASO 9: DATOS DE PRUEBA (FIXTURES)

Crear fixtures para poblar la base de datos:
```bash
python manage.py loaddata fixtures/users.json
python manage.py loaddata fixtures/publications.json
python manage.py loaddata fixtures/requests.json
```

---

## 🧪 PASO 10: TESTING

### 10.1 Tests de Modelos
```python
- test_user_creation
- test_publication_creation
- test_ece_request_creation
```

### 10.2 Tests de APIs
```python
- test_login_api
- test_create_publication
- test_review_publication
- test_tutor_opinion
```

---

## 🚀 PASO 11: DESPLIEGUE

### 11.1 Backend
```bash
# Levantar PostgreSQL con Docker
docker-compose up -d

# Correr servidor Django
python manage.py runserver 8000
```

### 11.2 Frontend
```bash
npm run dev
```

---

## 📈 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. ✅ Modelos (COMPLETADO)
2. ⏭️ Serializers
3. ⏭️ Views/ViewSets básicos
4. ⏭️ URLs
5. ⏭️ Migraciones y BD
6. ⏭️ Servicios Frontend
7. ⏭️ Integración por módulo:
   - Login/Autenticación
   - Publicaciones (Estudiante)
   - Solicitudes (Estudiante)
   - Gestión (Jefe)
   - Opiniones (Tutor)
   - Admin
8. ⏭️ Testing
9. ⏭️ Optimizaciones

---

## 📝 NOTAS IMPORTANTES

- Usar JWT para autenticación
- CORS configurado para desarrollo (localhost:5173)
- Validar archivos PDF en publicaciones
- Validar archivos PDF/DOC/DOCX en solicitudes
- Implementar paginación en listados
- Agregar filtros por estado, nivel, fecha
- Implementar búsqueda en publicaciones
- Logs automáticos en acciones críticas
- Notificaciones en tiempo real (opcional: Django Channels)

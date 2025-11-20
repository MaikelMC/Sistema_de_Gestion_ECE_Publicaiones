# 🧪 Guía de Pruebas del Sistema

## 🔐 Credenciales de Usuarios de Prueba

Todos los usuarios tienen la contraseña: **`password123`**

### 👨‍🎓 Estudiantes

| Usuario | Nombre | Matrícula | Carrera | Tutor Asignado |
|---------|--------|-----------|---------|----------------|
| `maria.lopez` | María López García | C411 | Ing. en Ciencias Informáticas | Dr. Roberto García |
| `juan.perez` | Juan Pérez Rodríguez | C412 | Ing. en Ciberseguridad | Dr. Roberto García |
| `ana.martinez` | Ana Martínez Díaz | C413 | Ing. en Ciencias Informáticas | Dra. Carmen Fernández |
| `mike` | Maikel Ferrero Sosa | 3ro | Ciberseguridad | (sin asignar) |

### 👨‍🏫 Tutores

| Usuario | Nombre | Especialidad | Grado Académico | Estudiantes |
|---------|--------|--------------|-----------------|-------------|
| `dr.garcia` | Roberto García Sánchez | Inteligencia Artificial | Doctor en Ciencias | María, Juan |
| `dra.fernandez` | Carmen Fernández Ruiz | Desarrollo de Software | Doctora en Ciencias Técnicas | Ana |

### 👔 Jefe de Departamento

| Usuario | Nombre | Rol |
|---------|--------|-----|
| `jefe.dpto` | Carlos Ramírez González | Jefe de Departamento |

### 🔧 Administrador

| Usuario | Nombre | Rol |
|---------|--------|-----|
| `admin` | Admin | Administrador |

---

## 🧪 Escenarios de Prueba

### 📚 Escenario 1: Flujo Completo de Publicación

#### 1.1 Como Estudiante (maria.lopez)
1. **Login**: http://localhost:5174
   - Usuario: `maria.lopez`
   - Contraseña: `password123`

2. **Crear Publicación**:
   - Ir a "Mis Publicaciones"
   - Click en "Nueva Publicación"
   - Completar formulario:
     ```
     Título: Aplicación de Machine Learning en Ciberseguridad
     Autores: María López García, Dr. Roberto García
     Revista: IEEE Security & Privacy
     Fecha de Publicación: 2024-10-15
     Volumen: 22
     Páginas: 45-58
     DOI: 10.1109/MSEC.2024.001
     Nivel: 2
     Resumen: Este artículo presenta una aplicación innovadora de técnicas de machine learning...
     ```
   - Subir archivo PDF (cualquier PDF de prueba)
   - Guardar

3. **Enviar para Revisión**:
   - En la lista de publicaciones, click en "Enviar a Revisión"
   - Confirmar

#### 1.2 Como Tutor (dr.garcia)
1. **Login** con `dr.garcia` / `password123`

2. **Ver Publicaciones de Estudiantes**:
   - Ir a "Mis Alumnos"
   - Ver lista de estudiantes asignados (María, Juan)
   
3. **Emitir Opinión**:
   - Ir a "Opiniones"
   - Ver publicaciones pendientes
   - Seleccionar la publicación de María
   - Emitir opinión:
     ```
     Opinión: La publicación presenta un trabajo sólido con metodología adecuada.
     Recomendación: Aprobada
     ```
   - Guardar

#### 1.3 Como Jefe de Departamento (jefe.dpto)
1. **Login** con `jefe.dpto` / `password123`

2. **Revisar Publicaciones**:
   - Ir a "Gestión de Publicaciones"
   - Ver publicaciones pendientes de revisión
   - Seleccionar la publicación de María
   
3. **Aprobar/Rechazar**:
   - Ver detalles completos
   - Ver opinión del tutor
   - Aprobar con comentario:
     ```
     Comentarios: Publicación aprobada. Cumple con los requisitos para ECE nivel 2.
     Estado: Aprobada
     ```

---

### 📄 Escenario 2: Solicitud ECE

#### 2.1 Como Estudiante (juan.perez)
1. **Login** con `juan.perez` / `password123`

2. **Crear Solicitud ECE**:
   - Ir a "Solicitudes"
   - Click en "Nueva Solicitud"
   - Completar:
     ```
     Descripción: Solicito presentar examen de culminación de estudios modalidad Publicaciones.
     He cumplido con:
     - 1 publicación nivel 2 aprobada
     - Opinión favorable del tutor
     - Promedio académico: 4.5
     ```
   - Subir documentos requeridos
   - Guardar y enviar

#### 2.2 Como Jefe (jefe.dpto)
1. **Ver Solicitudes Pendientes**:
   - Ir a "Gestión de Solicitudes"
   - Ver solicitud de Juan
   
2. **Revisar**:
   - Verificar requisitos
   - Aprobar/Rechazar con comentarios

---

### 👥 Escenario 3: Gestión de Usuarios

#### Como Administrador (admin)
1. **Login** con `admin`

2. **Ver Todos los Usuarios**:
   - Ir a "Gestión de Usuarios"
   - Ver lista completa con roles

3. **Crear Nuevo Usuario**:
   - Click en "Nuevo Usuario"
   - Completar datos:
     ```
     Username: carlos.ruiz
     Email: cruiz@estudiantes.uci.cu
     Nombre: Carlos
     Apellidos: Ruiz Hernández
     Rol: Estudiante
     Matrícula: C414
     Carrera: Ing. en Ciencias Informáticas
     Contraseña: password123
     ```
   - Guardar

4. **Asignar Tutor**:
   - Editar usuario creado
   - En sección de tutores, asignar a `dra.fernandez`

5. **Ver Logs del Sistema**:
   - Ir a "Logs del Sistema"
   - Ver todas las acciones registradas

---

## 🔍 Verificaciones Importantes

### ✅ Permisos por Rol

#### Estudiante debe poder:
- ✅ Ver solo sus propias publicaciones
- ✅ Crear publicaciones
- ✅ Editar publicaciones en estado "en_proceso"
- ✅ Ver sus solicitudes
- ✅ NO ver publicaciones de otros estudiantes
- ✅ NO revisar publicaciones

#### Tutor debe poder:
- ✅ Ver publicaciones de sus estudiantes asignados
- ✅ Emitir opiniones sobre publicaciones
- ✅ Ver progreso de sus estudiantes
- ✅ NO ver estudiantes no asignados
- ✅ NO aprobar publicaciones finalmente

#### Jefe debe poder:
- ✅ Ver todas las publicaciones
- ✅ Ver publicaciones pendientes de revisión
- ✅ Aprobar/Rechazar publicaciones
- ✅ Ver todas las solicitudes ECE
- ✅ Aprobar/Rechazar solicitudes
- ✅ Generar reportes

#### Admin debe poder:
- ✅ Todo lo anterior
- ✅ Gestionar usuarios (crear, editar, eliminar)
- ✅ Asignar roles
- ✅ Ver logs del sistema
- ✅ Configuración del sistema

---

## 🗄️ Verificar Base de Datos

### Ver datos en la base de datos:

```powershell
cd BackEnd
C:/Users/Dell/Desktop/Proyecto/.venv/Scripts/python.exe manage.py shell
```

```python
# Ver usuarios
from authentication.models import User
User.objects.values('username', 'role', 'first_name', 'last_name')

# Ver publicaciones
from publications.models import Publication
Publication.objects.values('title', 'student__username', 'status', 'nivel')

# Ver relaciones tutor-estudiante
from publications.models import TutorStudent
TutorStudent.objects.values('tutor__username', 'student__username', 'is_active')

# Ver solicitudes
from requests.models import ECERequest
ECERequest.objects.values('student__username', 'status', 'created_at')
```

---

## 🔧 Comandos Útiles

### Ver usuarios en la base de datos:
```powershell
cd BackEnd
python list_users.py
```

### Resetear contraseña de un usuario:
```powershell
python manage.py shell
```
```python
from authentication.models import User
user = User.objects.get(username='maria.lopez')
user.set_password('password123')
user.save()
```

### Ver logs del servidor:
Los logs se muestran en la terminal donde corre el backend.

---

## 📊 Datos de Prueba Reales vs Estáticos

### ✅ El sistema está configurado para trabajar con datos REALES:

1. **Todas las listas son dinámicas**:
   - ✅ Publicaciones cargadas desde la API
   - ✅ Usuarios cargados desde la BD
   - ✅ Solicitudes desde la BD
   - ✅ Filtros aplicados en el backend según rol

2. **Formularios envían datos reales**:
   - ✅ Crear publicación → POST al backend → se guarda en BD
   - ✅ Subir archivo → se guarda en `media/publications/`
   - ✅ Cambios de estado → se actualizan en BD

3. **Autenticación real**:
   - ✅ JWT tokens almacenados en localStorage
   - ✅ Tokens enviados en cada petición
   - ✅ Backend valida permisos

4. **NO hay datos mockeados o estáticos** en el frontend
   - Todo viene de la API
   - Todo se guarda en PostgreSQL

---

## 🎯 Checklist de Funcionalidades

### Backend ✅
- [x] API REST funcionando
- [x] Autenticación JWT
- [x] Permisos por rol
- [x] Filtros dinámicos
- [x] CORS configurado
- [x] Base de datos PostgreSQL
- [x] Migraciones aplicadas
- [x] Usuarios de prueba creados

### Frontend ✅
- [x] Rutas protegidas por rol
- [x] Layouts diferentes por rol
- [x] Servicios API configurados
- [x] Formularios con validación
- [x] Manejo de archivos
- [x] Toasts de notificación
- [x] Tokens en localStorage

---

## 🚀 URLs del Sistema

- **Frontend**: http://localhost:5174
- **Backend API**: http://127.0.0.1:8000/api
- **Admin Django**: http://127.0.0.1:8000/admin
- **Documentación API**: http://127.0.0.1:8000/api/

---

¡El sistema está completamente funcional con datos reales! 🎉

# Sistema de Gestión para la Modalidad ECE - Backend

Este es el backend del Sistema de Gestión para la Modalidad ECE - Publicaciones, desarrollado con Django Rest Framework.

## Tecnologías Utilizadas

- Python
- Django/Django Rest Framework
- PostgreSQL
- Docker y Docker Compose
- PgAdmin

## Requisitos Previos

- Python 3.x
- Docker y Docker Compose
- pip (gestor de paquetes de Python)

## Estructura del Proyecto

```
BackEnd/
├── authentication/       # App para manejo de autenticación
├── config/              # Configuraciones principales del proyecto
├── publications/        # App para gestión de publicaciones y tutores (Robertaco)
├── requests/           # App para manejo de solicitudes (Maikel Eudis)
├── manage.py           # Script de gestión de Django
└── docker-compose.yml  # Configuración de contenedores
```

## Configuración del Entorno

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/MaikelMC/Sistema-de-Gesti-n-para-la-Modalidad-ECE-Publicaciones-
   cd Sistema-de-Gesti-n-para-la-Modalidad-ECE-Publicaciones-/BackEnd
   ```
63*
2. **Crear y activar un entorno virtual**
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # En Windows
   ```

3. **Instalar dependencias**
   ```bash
   pip install django djangorestframework python-dotenv psycopg2-binary
   ```

4. **Configurar variables de entorno**
   
   Crear un archivo `.env` en la raíz del proyecto con:
   ```
   SECRET_KEY=tu-clave-secreta
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```

## Base de Datos

El proyecto utiliza PostgreSQL a través de Docker. Para iniciar la base de datos:

1. **Iniciar los contenedores**
   ```bash
   docker-compose up -d
   ```

   Esto iniciará:
   - PostgreSQL en el puerto 5433
   - PgAdmin en el puerto 5050

2. **Credenciales de PostgreSQL**
   - Base de datos: publications_db
   - Usuario: postgres
   - Contraseña: admin123

3. **Acceso a PgAdmin**
   - URL: http://localhost:5050
   - Email: admin@admin.com
   - Contraseña: admin

## Migraciones

Para inicializar la base de datos:

```bash
python manage.py makemigrations
python manage.py migrate
```

## Aplicaciones

### Authentication
- Manejo de usuarios y autenticación
- Modelo de Usuario con campos:
  - username
  - email
  - password
  - is_admin

### Publications
- Gestión de publicaciones (en desarrollo)

### Requests
- Manejo de solicitudes (en desarrollo)

## Ejecución del Proyecto

Para iniciar el servidor de desarrollo:

```bash
python manage.py runserver
```

El servidor estará disponible en `http://localhost:8000`

## Estado Actual

El proyecto está en fase inicial de desarrollo con:

- ✅ Configuración básica del proyecto
- ✅ Configuración de Docker para base de datos
- ✅ Modelo básico de usuarios
- 🚧 Sistema de autenticación en desarrollo
- 🚧 Módulo de publicaciones en desarrollo
- 🚧 Módulo de solicitudes en desarrollo

## Contribución

1. Hacer fork del repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Contacto

MaikelMC - [GitHub](https://github.com/MaikelMC)

Link del proyecto: [https://github.com/MaikelMC/Sistema-de-Gesti-n-para-la-Modalidad-ECE-Publicaciones-](https://github.com/MaikelMC/Sistema-de-Gesti-n-para-la-Modalidad-ECE-Publicaciones-)
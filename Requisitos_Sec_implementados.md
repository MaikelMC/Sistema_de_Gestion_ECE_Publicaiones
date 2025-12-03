
# Requisitos_Sec implementados

Este documento resume, paso a paso, todos los requisitos de seguridad y auditoría que se implementaron en el proyecto durante nuestra conversación, los archivos tocados y cómo probar cada uno. Está pensado para dejar constancia técnica clara para revisión y despliegue.

**Resumen general**:
- Se implementó un sistema de auditoría exhaustivo (SystemLog) que registra identidad de usuario, IP, timestamp, recurso, acción, resultado y metadatos.
- Se añadió un sistema de alarmas/ notificaciones administrativas (AdminNotification) para eventos críticos.
- Se aplicaron medidas para proteger datos sensibles en cliente y transporte: encabezados No-Cache, cabeceras de seguridad y reglas de envío por POST en endpoints sensibles.
- Se diseñaron scripts SQL para crear roles de BD con privilegios mínimos y un script de verificación.

---

**1) Auditoría completa (SystemLog)**

- Objetivo:
  - Registrar trazas completas para acciones relevantes: login/logout, intentos fallidos, CRUD sobre usuarios y objetos, cambios de configuración, errores de sistema/BD y accesos no autorizados.

- Qué se implementó (pasos):
  1. Se amplió `requests.models.SystemLog` para incluir más `ACTION_CHOICES` y aumentar `action.max_length` a 50 para evitar truncados.
  2. Se añadieron llamadas a la función de creación de logs (`log_event` o equivalente) desde:
     - `authentication/signals.py` para `user_logged_in`, `user_login_failed`, `user_logged_out`.
     - Vistas que realizan cambios críticos (p. ej. `SystemConfigurationViewSet`) para registrar cambios de configuración.
  3. Se corrigieron problemas de registro originados por importación de señales (AppConfig) e identación que impedían que signals se registraran.

- Archivos relevantes:
  - `requests/models.py` (SystemLog cambios)
  - `authentication/signals.py` (registro de login/logout/failed)
  - `requests/views.py` / `requests/serializers.py` (puntos donde se generan logs de cambios)

- Cómo probar:
  - Hacer login/logout y revisar la tabla `requests_systemlog` en la BD.
  - Crear/editar/eliminar usuarios y revisar entradas correspondientes.

---

**2) Alarmas y notificaciones administrativas (AdminNotification)**

- Objetivo:
  - Generar notificaciones automáticas para administradores ante eventos relevantes: intentos fallidos repetidos, bloqueo de usuario, accesos simultáneos desde IP distintas, errores críticos del sistema/BD y accesos no autorizados.

- Qué se implementó (pasos):
  1. Se creó el modelo `AdminNotification` con campos: `notification_type`, `severity`, `title`, `message`, `user FK`, `ip_address`, `metadata JSON`, `is_read`, `is_resolved`, `read_at`, `resolved_at`, `resolved_by`.
  2. Se añadió `ActiveSession` para detectar accesos simultáneos (almacena `user`, `session_key`, `ip_address`, timestamps).
  3. Helpers implementados en `requests/utils.py`:
     - `create_notification(...)` — crea una notificación y la persiste.
     - `check_simultaneous_access(user, request)` — detecta múltiples IPs y crea notificación cuando aplica.
  4. Integración de triggers:
     - En `authentication/signals.py` se generan notificaciones en `handle_login_failed` (umbral de intentos, bloqueo) y `handle_login_success` (llama a `check_simultaneous_access`).
     - En `config/audit_middleware.py` se generan notificaciones para errores críticos (`500`) y accesos no autorizados (`401/403`).
  5. API Read-only para notificaciones: `requests/notification_views.py` (ReadOnlyModelViewSet) con acciones `list`, `mark_read`, `resolve`, `stats`. Paginación deshabilitada para el endpoint de notificaciones (devuelve lista directa).
  6. Interfaz frontend: componentes React (`Front-End/src/pages/.../Notificaciones.jsx`, hook `useNotifications.js`) para listar notificaciones, estadísticas, marcar como leídas y resolverlas; badge en `AdminLayout.jsx` para contar notificaciones no leídas.
  7. Migraciones creadas/aplicadas (`requests` -> `0005_activesession_adminnotification.py`).

- Archivos relevantes:
  - `requests/models.py` (AdminNotification, ActiveSession)
  - `requests/utils.py` (create_notification, check_simultaneous_access)
  - `authentication/signals.py` (triggers de notificación)
  - `config/audit_middleware.py` (generación de notificaciones en excepciones/401/403)
  - `requests/notification_views.py`, `requests/serializers.py`
  - Frontend: `Front-End/src/pages/.../Notificaciones.jsx`, `Front-End/src/hooks/useNotifications.js`, `Front-End/src/components/Layout/AdminLayout.jsx`

- Cómo probar:
  - Provocar un login fallido repetido y verificar `requests_adminnotification` y la UI en `/admin/notificaciones`.
  - Forzar un error 500 (en entorno de desarrollo) y verificar creación de notificación.

---

**3) Protección de datos sensibles en el cliente y transporte**

- Objetivo:
  - Evitar cacheo de respuestas con datos sensibles, impedir envío por métodos inseguros y reducir autocompletado en formularios.

- Qué se implementó (pasos):
  1. `config/security_middleware.py` (nuevo):
     - `NoCacheMiddleware`: añade cabeceras `Cache-Control: no-store, no-cache, must-revalidate, private`, `Pragma: no-cache`, `Expires: 0` y cabeceras adicionales: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` para respuestas que tienen patrón `/api/`.
     - `SecureFormMiddleware`: fuerza que endpoints sensibles (login, register, token refresh, password reset) acepten solo `POST`. Si se accede por `GET` devuelve 405.
  2. Formularios del frontend: inputs importantes usan `autoComplete="off"` o `autoComplete="new-password"` para reducir almacenamiento en el cliente (Login/Register components).
  3. `settings.py`: se dejaron placeholders y recomendaciones (`SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_HSTS_SECONDS`) para producción; middleware registrada en la cadena de middlewares.

- Archivos relevantes:
  - `config/security_middleware.py`
  - `config/settings.py` (registro de middleware y placeholders de seguridad)
  - `Front-End/src/pages/.../Login.jsx`, `Register.jsx` (atributos `autoComplete`)

- Cómo probar:
  - Desde navegador/auditoría HTTP (DevTools): comprobar encabezados `Cache-Control`, `Pragma`, `Expires` en respuestas `/api/...`.
  - Intentar acceder a `/api/auth/login/` por GET y comprobar 405.

---

**4) Privilegios de base de datos (principio de menor privilegio)**

- Objetivo:
  - Crear roles de BD limitados para la aplicación y para backups, evitando privilegios DBA.

- Qué se entregó (pasos):
  1. Script `BackEnd/setup_db_roles.sql` que crea tres roles: `ece_app_user`, `ece_readonly_user`, `ece_backup_user` con `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE` y contraseñas de ejemplo; asigna privilegios `CONNECT`, `USAGE` y conceden `SELECT/INSERT/UPDATE/DELETE` a `ece_app_user` sobre tablas existentes, `SELECT` a readonly/backup y configura `ALTER DEFAULT PRIVILEGES` para futuras tablas y secuencias.
  2. Script `BackEnd/verify_db_privileges.sql` que consulta `pg_roles`, `information_schema.table_privileges` y `pg_sequences` para verificar permisos y produce un resumen de estado.
  3. Ejecución de `setup_db_roles.sql` localmente con `psql` (ejemplo de comandos y ajuste de puerto si el servidor corre en `5433`).
  4. Ejemplos y recomendaciones para `pg_hba.conf` y acciones_post_creacion (no incluir `trust` en producción; usar conexiones seguras y revisar `pg_hba.conf`).

- Archivos relevantes:
  - `BackEnd/setup_db_roles.sql`
  - `BackEnd/verify_db_privileges.sql`
  - `BackEnd/.env.production.example` (ejemplo de `DB_USER=ece_app_user`)

- Cómo probar:
  - Ejecutar (ajusta puerto si necesario):
    ```powershell
    & 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe' -U postgres -h localhost -p 5433 -d publications_db -f ".\\BackEnd\\setup_db_roles.sql"
    & 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe' -U postgres -h localhost -p 5433 -d publications_db -f ".\\BackEnd\\verify_db_privileges.sql"
    ```
  - Conectar como `ece_app_user` y verificar que puede `SELECT/INSERT/UPDATE/DELETE` sobre tablas de aplicación y no puede crear roles/DB.

---

**5) Ajustes y correcciones necesarias durante el proceso (depuración y hardening)**

- Problemas detectados y soluciones aplicadas:
  - `psql` no en `PATH`: se documentó cómo usar ruta completa a `psql.exe` o añadir la carpeta `bin` al `PATH` (temporal/permanente) y alternativas (pgAdmin/WSL/Django management command).
  - Signals no se ejecutaban: AppConfig no importaba correctamente `signals` → se corrigió el `apps.py` e indentación en `authentication/signals.py`.
  - Campo `action` en `SystemLog` corto: se elevó `max_length` a 50 y se creó migración.
  - Endpoint de notificaciones devolvía 500/404/errores en frontend: se ajustó la serialización, se deshabilitó paginación para ese endpoint y se corrigieron URLs duplicadas de `/api` en frontend.

---

**6) Comandos útiles ejecutados durante la integración (resumen)**

- Migraciones y chequeos Django:
  ```powershell
  py manage.py makemigrations requests
  py manage.py migrate
  py manage.py check
  ```

- Ejecutar scripts SQL con `psql` (ejemplo puerto 5433):
  ```powershell
  & 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe' -U postgres -h localhost -p 5433 -d publications_db -f ".\\BackEnd\\setup_db_roles.sql"
  & 'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe' -U postgres -h localhost -p 5433 -d publications_db -f ".\\BackEnd\\verify_db_privileges.sql"
  ```

---

**7) Archivos creados / modificados (lista focalizada)**

- Nuevos/Modificados en backend:
  - `authentication/signals.py` (correcciones + notificaciones)
  - `requests/models.py` (AdminNotification, ActiveSession, SystemLog ajustes)
  - `requests/utils.py` (create_notification, check_simultaneous_access)
  - `requests/serializers.py` (AdminNotificationSerializer)
  - `requests/notification_views.py` (AdminNotificationViewSet)
  - `config/security_middleware.py` (NoCacheMiddleware, SecureFormMiddleware)
  - `config/audit_middleware.py` (se amplia para notificaciones en errores)
  - `BackEnd/setup_db_roles.sql`, `BackEnd/verify_db_privileges.sql`, `BackEnd/.env.production.example`

- Frontend:
  - `Front-End/src/pages/.../Notificaciones.jsx`, `Notificaciones.css`
  - `Front-End/src/hooks/useNotifications.js`
  - `Front-End/src/components/Layout/AdminLayout.jsx` (badge de notificaciones)

---

**8) Verificaciones y pruebas recomendadas antes de producción**

- Pruebas funcionales:
  - Generar un conjunto de eventos (login fallidos, login exitoso desde 2 IPs, error 500, intento 401) y verificar que tanto `SystemLog` como `AdminNotification` se crean y aparecen en la UI.
  - Probar el flujo `mark_read` y `resolve` en la API y UI.

- Pruebas de seguridad y hardening:
  - Revisar `pg_hba.conf` y asegurar métodos `md5`/`scram-sha-256` para conexiones remotas, deshabilitar `trust`.
  - Habilitar `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` y configurar `SECURE_HSTS_SECONDS` sólo si hay TLS en producción.
  - Revisar que `ece_app_user` no tenga privilegios de `CREATEDB`/`CREATEROLE`.

---

**9) Pendientes / Mejoras posibles**

- Instrumentar notificaciones para "modificaciones post-aprobación" en `Publications` y `ECERequests` (actualmente preparado pero requiere enganchar señales/handlers concretos en los modelos correspondientes).
- Interfaz administrativa para configurar umbrales de notificaciones y suscriptores/roles.
- Tests automatizados de integración para triggers de notificación y reglas de seguridad.

---

Si quieres, puedo:
- Añadir una `management command` que ejecute los SQL desde Django (útil si no quieres usar `psql`).
- Instrumentar la notificación de "post-aprobación" en `publications` y `requests` (añadir signal en `models.save`).
- Crear un README corto dentro de `BackEnd/` con pasos de despliegue seguro (pg_hba, usuarios, environment variables y checklist de producción).

Fin del documento.

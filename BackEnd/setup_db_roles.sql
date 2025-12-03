-- ==============================================================================
-- CONFIGURACIÓN DE ROLES Y PRIVILEGIOS DE BASE DE DATOS
-- Sistema de Gestión ECE por Publicaciones
-- ==============================================================================
-- Este script crea roles específicos con privilegios mínimos necesarios
-- sin otorgar permisos de DBA (superusuario)
-- ==============================================================================

-- IMPORTANTE: Ejecutar este script como superusuario de PostgreSQL
-- psql -U postgres -d publications_db -f setup_db_roles.sql

-- ==============================================================================
-- 1. CREAR ROLES ESPECÍFICOS
-- ==============================================================================

-- Rol para la aplicación Django (lectura/escritura en tablas de aplicación)
DROP ROLE IF EXISTS ece_app_user;
CREATE ROLE ece_app_user WITH
    LOGIN
    NOCREATEDB
    NOCREATEROLE
    NOSUPERUSER
    NOREPLICATION
    CONNECTION LIMIT 20
    PASSWORD 'CHANGE_THIS_PASSWORD_IN_PRODUCTION';

COMMENT ON ROLE ece_app_user IS 'Usuario de aplicación Django con privilegios limitados';

-- Rol de solo lectura para reportes y auditoría
DROP ROLE IF EXISTS ece_readonly_user;
CREATE ROLE ece_readonly_user WITH
    LOGIN
    NOCREATEDB
    NOCREATEROLE
    NOSUPERUSER
    NOREPLICATION
    CONNECTION LIMIT 5
    PASSWORD 'CHANGE_THIS_PASSWORD_IN_PRODUCTION';

COMMENT ON ROLE ece_readonly_user IS 'Usuario de solo lectura para reportes y consultas';

-- Rol para backups (solo lectura de todas las tablas)
DROP ROLE IF EXISTS ece_backup_user;
CREATE ROLE ece_backup_user WITH
    LOGIN
    NOCREATEDB
    NOCREATEROLE
    NOSUPERUSER
    NOREPLICATION
    CONNECTION LIMIT 2
    PASSWORD 'CHANGE_THIS_PASSWORD_IN_PRODUCTION';

COMMENT ON ROLE ece_backup_user IS 'Usuario para realizar backups de la base de datos';

-- ==============================================================================
-- 2. OTORGAR PRIVILEGIOS AL ROL DE APLICACIÓN (ece_app_user)
-- ==============================================================================

-- Conectar a la base de datos de publicaciones
\c publications_db

-- Otorgar privilegios de uso en el esquema public
GRANT USAGE ON SCHEMA public TO ece_app_user;

-- Otorgar privilegios de conexión a la base de datos
GRANT CONNECT ON DATABASE publications_db TO ece_app_user;

-- Otorgar privilegios en todas las tablas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ece_app_user;

-- Otorgar privilegios en todas las secuencias (para campos auto-incrementales)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ece_app_user;

-- Otorgar privilegios en tablas futuras (cuando se ejecuten migraciones)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ece_app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE, SELECT ON SEQUENCES TO ece_app_user;

-- Permitir crear tablas temporales para sesiones
GRANT TEMPORARY ON DATABASE publications_db TO ece_app_user;

-- ==============================================================================
-- 3. OTORGAR PRIVILEGIOS AL ROL DE SOLO LECTURA (ece_readonly_user)
-- ==============================================================================

-- Otorgar privilegios de uso en el esquema public
GRANT USAGE ON SCHEMA public TO ece_readonly_user;

-- Otorgar privilegios de conexión
GRANT CONNECT ON DATABASE publications_db TO ece_readonly_user;

-- Solo SELECT en todas las tablas
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ece_readonly_user;

-- Privilegios en tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO ece_readonly_user;

-- ==============================================================================
-- 4. OTORGAR PRIVILEGIOS AL ROL DE BACKUP (ece_backup_user)
-- ==============================================================================

-- Otorgar privilegios de uso en el esquema public
GRANT USAGE ON SCHEMA public TO ece_backup_user;

-- Otorgar privilegios de conexión
GRANT CONNECT ON DATABASE publications_db TO ece_backup_user;

-- Solo SELECT en todas las tablas y secuencias (necesario para pg_dump)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ece_backup_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO ece_backup_user;

-- Privilegios en tablas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO ece_backup_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON SEQUENCES TO ece_backup_user;

-- ==============================================================================
-- 5. REVOCAR PRIVILEGIOS PÚBLICOS (Seguridad adicional)
-- ==============================================================================

-- Revocar privilegios predeterminados del rol PUBLIC
REVOKE ALL ON DATABASE publications_db FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

-- ==============================================================================
-- 6. CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS) - OPCIONAL
-- ==============================================================================
-- Descomentar si se desea implementar seguridad a nivel de fila

-- Ejemplo para tabla de usuarios (solo ver sus propios registros)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY users_isolation_policy ON users
--     USING (username = current_user)
--     WITH CHECK (username = current_user);

-- ==============================================================================
-- 7. VERIFICACIÓN DE ROLES Y PRIVILEGIOS
-- ==============================================================================

-- Verificar que los roles fueron creados correctamente
\du

-- Verificar privilegios en la base de datos
\l publications_db

-- Verificar privilegios en tablas
\dp

-- ==============================================================================
-- 8. CONFIGURACIÓN ADICIONAL DE SEGURIDAD
-- ==============================================================================

-- Limitar conexiones por IP (editar pg_hba.conf)
-- Agregar estas líneas en pg_hba.conf:
-- # Conexión desde aplicación local
-- host    publications_db    ece_app_user       127.0.0.1/32         scram-sha-256
-- host    publications_db    ece_app_user       ::1/128              scram-sha-256
-- 
-- # Conexión readonly desde red interna (ejemplo)
-- host    publications_db    ece_readonly_user  192.168.1.0/24       scram-sha-256
--
-- # Denegar todo lo demás
-- host    all                all                0.0.0.0/0            reject

-- Reiniciar PostgreSQL después de editar pg_hba.conf:
-- sudo systemctl restart postgresql

-- ==============================================================================
-- 9. AUDITORÍA Y MONITOREO
-- ==============================================================================

-- Habilitar logging de conexiones y consultas lentas en postgresql.conf
-- log_connections = on
-- log_disconnections = on
-- log_duration = on
-- log_min_duration_statement = 1000  # Log queries > 1 segundo

-- ==============================================================================
-- FIN DEL SCRIPT
-- ==============================================================================

PRINT 'Roles y privilegios configurados correctamente';
PRINT 'IMPORTANTE: Cambiar las contraseñas en producción';
PRINT 'IMPORTANTE: Actualizar settings.py con el usuario ece_app_user';

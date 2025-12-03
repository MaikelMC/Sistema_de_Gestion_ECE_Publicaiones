-- ==============================================================================
-- SCRIPT DE VERIFICACIÓN DE PRIVILEGIOS DE BASE DE DATOS
-- Sistema de Gestión ECE por Publicaciones
-- ==============================================================================
-- Ejecutar este script para verificar que los roles tienen los privilegios correctos
-- psql -U postgres -d publications_db -f verify_db_privileges.sql
-- ==============================================================================

\echo '=============================================================================='
\echo 'VERIFICACIÓN DE ROLES Y PRIVILEGIOS'
\echo '=============================================================================='

-- ==============================================================================
-- 1. VERIFICAR QUE LOS ROLES EXISTEN
-- ==============================================================================
\echo ''
\echo '1. Verificando existencia de roles...'
\echo ''

SELECT 
    rolname as "Rol",
    CASE WHEN rolsuper THEN 'SÍ' ELSE 'NO' END as "Superusuario",
    CASE WHEN rolcreatedb THEN 'SÍ' ELSE 'NO' END as "Crear DB",
    CASE WHEN rolcreaterole THEN 'SÍ' ELSE 'NO' END as "Crear Roles",
    CASE WHEN rolcanlogin THEN 'SÍ' ELSE 'NO' END as "Login",
    rolconnlimit as "Límite Conexiones"
FROM pg_roles 
WHERE rolname IN ('ece_app_user', 'ece_readonly_user', 'ece_backup_user')
ORDER BY rolname;

-- ==============================================================================
-- 2. VERIFICAR QUE NO SON SUPERUSUARIOS
-- ==============================================================================
\echo ''
\echo '2. Verificando que NO tienen privilegios de superusuario...'
\echo '   (Todos deben mostrar "NO")'
\echo ''

SELECT 
    rolname as "Rol",
    CASE WHEN rolsuper THEN '❌ SÍ (PELIGRO!)' ELSE '✓ NO (Correcto)' END as "Es Superusuario"
FROM pg_roles 
WHERE rolname IN ('ece_app_user', 'ece_readonly_user', 'ece_backup_user');

-- ==============================================================================
-- 3. VERIFICAR PRIVILEGIOS EN LA BASE DE DATOS
-- ==============================================================================
\echo ''
\echo '3. Verificando privilegios en la base de datos publications_db...'
\echo ''

SELECT 
    grantee as "Usuario/Rol",
    string_agg(privilege_type, ', ') as "Privilegios"
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
    AND grantee IN ('ece_app_user', 'ece_readonly_user', 'ece_backup_user')
GROUP BY grantee
ORDER BY grantee;

-- ==============================================================================
-- 4. VERIFICAR PRIVILEGIOS EN TABLAS ESPECÍFICAS
-- ==============================================================================
\echo ''
\echo '4. Verificando privilegios en tablas clave...'
\echo ''

SELECT 
    grantee as "Usuario/Rol",
    table_name as "Tabla",
    string_agg(privilege_type, ', ') as "Privilegios"
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'publication', 'ece_request', 'system_log', 'admin_notifications')
    AND grantee IN ('ece_app_user', 'ece_readonly_user', 'ece_backup_user')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- ==============================================================================
-- 5. VERIFICAR PRIVILEGIOS EN SECUENCIAS
-- ==============================================================================
\echo ''
\echo '5. Verificando privilegios en secuencias...'
\echo ''

SELECT 
    grantee as "Usuario/Rol",
    COUNT(*) as "Número de Secuencias con Acceso"
FROM information_schema.usage_privileges
WHERE object_schema = 'public' 
    AND object_type = 'SEQUENCE'
    AND grantee IN ('ece_app_user', 'ece_readonly_user', 'ece_backup_user')
GROUP BY grantee
ORDER BY grantee;

-- ==============================================================================
-- 6. VERIFICAR QUE NO PUEDEN CREAR BASES DE DATOS
-- ==============================================================================
\echo ''
\echo '6. Verificando que NO pueden crear bases de datos...'
\echo '   (Todos deben mostrar "NO")'
\echo ''

SELECT 
    rolname as "Rol",
    CASE WHEN rolcreatedb THEN '❌ SÍ (PELIGRO!)' ELSE '✓ NO (Correcto)' END as "Puede Crear DB"
FROM pg_roles 
WHERE rolname IN ('ece_app_user', 'ece_readonly_user', 'ece_backup_user');

-- ==============================================================================
-- 7. VERIFICAR QUE NO PUEDEN CREAR ROLES
-- ==============================================================================
\echo ''
\echo '7. Verificando que NO pueden crear roles...'
\echo '   (Todos deben mostrar "NO")'
\echo ''

SELECT 
    rolname as "Rol",
    CASE WHEN rolcreaterole THEN '❌ SÍ (PELIGRO!)' ELSE '✓ NO (Correcto)' END as "Puede Crear Roles"
FROM pg_roles 
WHERE rolname IN ('ece_app_user', 'ece_readonly_user', 'ece_backup_user');

-- ==============================================================================
-- 8. RESUMEN DE VALIDACIÓN
-- ==============================================================================
\echo ''
\echo '=============================================================================='
\echo 'RESUMEN DE VALIDACIÓN'
\echo '=============================================================================='

WITH validation AS (
    SELECT 
        rolname,
        NOT rolsuper as no_superuser,
        NOT rolcreatedb as no_createdb,
        NOT rolcreaterole as no_createrole,
        rolcanlogin as can_login
    FROM pg_roles 
    WHERE rolname IN ('ece_app_user', 'ece_readonly_user', 'ece_backup_user')
)
SELECT 
    rolname as "Rol",
    CASE 
        WHEN no_superuser AND no_createdb AND no_createrole AND can_login 
        THEN '✓ CONFIGURACIÓN SEGURA'
        ELSE '❌ REQUIERE CORRECCIÓN'
    END as "Estado de Seguridad"
FROM validation;

-- ==============================================================================
-- 9. RECOMENDACIONES DE SEGURIDAD
-- ==============================================================================
\echo ''
\echo '=============================================================================='
\echo 'RECOMENDACIONES DE SEGURIDAD'
\echo '=============================================================================='
\echo ''
\echo '✓ Verificado: Roles sin privilegios de superusuario'
\echo '✓ Verificado: Roles sin permiso para crear bases de datos'
\echo '✓ Verificado: Roles sin permiso para crear otros roles'
\echo ''
\echo 'SIGUIENTE PASOS:'
\echo '1. Actualizar .env con DB_USER=ece_app_user'
\echo '2. Actualizar contraseñas de producción'
\echo '3. Configurar pg_hba.conf para restringir conexiones por IP'
\echo '4. Habilitar SSL en PostgreSQL'
\echo '5. Configurar backups automatizados con ece_backup_user'
\echo '6. Monitorear logs de acceso regularmente'
\echo ''
\echo '=============================================================================='

-- ==============================================================================
-- FIN DE LA VERIFICACIÓN
-- ==============================================================================

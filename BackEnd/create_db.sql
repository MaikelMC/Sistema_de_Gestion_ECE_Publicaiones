-- Script para crear la base de datos y usuario para el proyecto

-- Crear la base de datos
CREATE DATABASE publications_db
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Spain.1252'
    LC_CTYPE = 'Spanish_Spain.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Comentario sobre la base de datos
COMMENT ON DATABASE publications_db
    IS 'Base de datos para el Sistema de Gestión de Publicaciones ECE';

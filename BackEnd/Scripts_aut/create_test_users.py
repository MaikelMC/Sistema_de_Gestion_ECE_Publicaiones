#!/usr/bin/env python
"""
Script para crear usuarios de prueba con todos los roles
"""
import os
import sys
import django

# Configurar Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from authentication.models import User
from django.db import IntegrityError

def create_user_if_not_exists(username, email, password, role, **extra_fields):
    """Crear usuario si no existe"""
    try:
        if User.objects.filter(username=username).exists():
            print(f"⚠️  Usuario '{username}' ya existe")
            user = User.objects.get(username=username)
            # Actualizar rol si es diferente
            if user.role != role:
                user.role = role
                for key, value in extra_fields.items():
                    setattr(user, key, value)
                user.save()
                print(f"✅ Usuario '{username}' actualizado a rol '{role}'")
            return user
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            **extra_fields
        )
        print(f"✅ Usuario '{username}' creado exitosamente (rol: {role})")
        return user
    except IntegrityError as e:
        print(f"❌ Error al crear usuario '{username}': {e}")
        return None

def main():
    print("="*70)
    print("  CREACIÓN DE USUARIOS DE PRUEBA")
    print("="*70)
    print()
    
    # Contraseña por defecto
    default_password = "password123"
    
    # 1. Crear estudiantes
    print("📚 CREANDO ESTUDIANTES...")
    estudiante1 = create_user_if_not_exists(
        username='maria.lopez',
        email='mlopez@estudiantes.uci.cu',
        password=default_password,
        role='estudiante',
        first_name='María',
        last_name='López García',
        matricula='C411',
        carrera='Ingeniería en Ciencias Informáticas',
        telefono='53123456',
        activo=True
    )
    
    estudiante2 = create_user_if_not_exists(
        username='juan.perez',
        email='jperez@estudiantes.uci.cu',
        password=default_password,
        role='estudiante',
        first_name='Juan',
        last_name='Pérez Rodríguez',
        matricula='C412',
        carrera='Ingeniería en Ciberseguridad',
        telefono='53234567',
        activo=True
    )
    
    estudiante3 = create_user_if_not_exists(
        username='ana.martinez',
        email='amartinez@estudiantes.uci.cu',
        password=default_password,
        role='estudiante',
        first_name='Ana',
        last_name='Martínez Díaz',
        matricula='C413',
        carrera='Ingeniería en Ciencias Informáticas',
        telefono='53345678',
        activo=True
    )
    
    print()
    
    # 2. Crear tutores
    print("👨‍🏫 CREANDO TUTORES...")
    tutor1 = create_user_if_not_exists(
        username='dr.garcia',
        email='rgarcia@uci.cu',
        password=default_password,
        role='tutor',
        first_name='Roberto',
        last_name='García Sánchez',
        especialidad='Inteligencia Artificial',
        grado_academico='Doctor en Ciencias',
        telefono='53456789',
        activo=True
    )
    
    tutor2 = create_user_if_not_exists(
        username='dra.fernandez',
        email='cfernandez@uci.cu',
        password=default_password,
        role='tutor',
        first_name='Carmen',
        last_name='Fernández Ruiz',
        especialidad='Desarrollo de Software',
        grado_academico='Doctora en Ciencias Técnicas',
        telefono='53567890',
        activo=True
    )
    
    print()
    
    # 3. Crear jefe de departamento
    print("👔 CREANDO JEFE DE DEPARTAMENTO...")
    jefe = create_user_if_not_exists(
        username='jefe.dpto',
        email='jdepartamento@uci.cu',
        password=default_password,
        role='jefe',
        first_name='Carlos',
        last_name='Ramírez González',
        grado_academico='Doctor en Ciencias',
        telefono='53678901',
        activo=True
    )
    
    print()
    
    # 4. Asignar tutores a estudiantes
    print("🔗 ASIGNANDO TUTORES A ESTUDIANTES...")
    from publications.models import TutorStudent
    
    assignments = [
        (tutor1, estudiante1),
        (tutor1, estudiante2),
        (tutor2, estudiante3),
    ]
    
    for tutor, student in assignments:
        if tutor and student:
            assignment, created = TutorStudent.objects.get_or_create(
                tutor=tutor,
                student=student,
                defaults={
                    'is_active': True,
                    'progress': 0
                }
            )
            if created:
                print(f"✅ {student.get_full_name()} asignado(a) a {tutor.get_full_name()}")
            else:
                print(f"⚠️  Asignación ya existe: {student.username} → {tutor.username}")
    
    print()
    print("="*70)
    print("  RESUMEN DE USUARIOS")
    print("="*70)
    print(f"\n{'Usuario':<20} {'Nombre':<30} {'Rol':<15} {'Email':<30}")
    print("-"*95)
    
    for user in User.objects.all().order_by('role', 'username'):
        print(f"{user.username:<20} {user.get_full_name():<30} {user.get_role_display():<15} {user.email:<30}")
    
    print()
    print("="*70)
    print(f"  Contraseña para todos los usuarios: {default_password}")
    print("="*70)
    print()
    print("✅ USUARIOS CREADOS EXITOSAMENTE")
    print()

if __name__ == '__main__':
    main()

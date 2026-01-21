#!/usr/bin/env python3
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from publications.models import StudentOpinion, TutorStudent

User = get_user_model()

print("=" * 80)
print("🔍 DIAGNÓSTICO DEL ENDPOINT /student-opinions/ PARA JEFE")
print("=" * 80)

# 1. Verificar que el usuario jefe existe
try:
    jefe = User.objects.get(username='antonio')
    print(f"\n✅ Usuario jefe encontrado:")
    print(f"   Username: {jefe.username}")
    print(f"   ID: {jefe.id}")
    print(f"   Rol: {jefe.role}")
    print(f"   Email: {jefe.email}")
except User.DoesNotExist:
    print(f"\n❌ Usuario 'antonio' no encontrado")
    exit(1)

# 2. Contar opiniones totales en la BD
total_opinions = StudentOpinion.objects.count()
print(f"\n📊 Opiniones totales en la BD: {total_opinions}")

if total_opinions > 0:
    print(f"\n   Detalles de opiniones:")
    for opinion in StudentOpinion.objects.all():
        print(f"   - ID: {opinion.id}")
        print(f"     Tutor: {opinion.tutor.get_full_name()} (ID: {opinion.tutor.id})")
        print(f"     Estudiante: {opinion.student.get_full_name()} (ID: {opinion.student.id})")
        print(f"     Archivo: {opinion.file}")
        print(f"     Creado: {opinion.created_at}")
else:
    print(f"\n   ⚠️ No hay opiniones en la base de datos")

# 3. Verificar que hay tutores asignados a estudiantes
print(f"\n📋 Relaciones Tutor-Estudiante:")
tutor_students = TutorStudent.objects.filter(is_active=True)
print(f"   Total de relaciones activas: {tutor_students.count()}")

if tutor_students.count() > 0:
    print(f"   Primeras 5 relaciones:")
    for ts in tutor_students[:5]:
        print(f"   - Tutor: {ts.tutor.get_full_name()}, Estudiante: {ts.student.get_full_name()}")

# 4. Simular lo que haría get_queryset para jefe
print(f"\n🔐 Simulando get_queryset() para jefe (rol='jefe'):")
print(f"   Jefe puede ver TODAS las opiniones")

# Filtrar como lo hace el backend
opinions_for_jefe = StudentOpinion.objects.all().order_by('-created_at')
print(f"   Total de opiniones que vería jefe: {opinions_for_jefe.count()}")

if opinions_for_jefe.count() > 0:
    print(f"\n   Opiniones que vería jefe:")
    for opinion in opinions_for_jefe:
        print(f"   ✅ {opinion.student.get_full_name()} - Tutor: {opinion.tutor.get_full_name()}")

# 5. Verificar el serializer
print(f"\n🔄 Probando serializer:")
from publications.serializers import StudentOpinionSerializer

if opinions_for_jefe.count() > 0:
    opinion = opinions_for_jefe.first()
    serializer = StudentOpinionSerializer(opinion)
    print(f"   Datos serializados:")
    print(json.dumps(serializer.data, indent=2, default=str))
else:
    print(f"   ⚠️ No hay opiniones para serializar")

# 6. Verificar URLs
print(f"\n🌐 Verificando rutas:")
from django.urls import get_resolver
from django.urls.exceptions import Resolver404

resolver = get_resolver()
print(f"   Buscando /api/publications/student-opinions/...")
try:
    match = resolver.resolve('/api/publications/student-opinions/')
    print(f"   ✅ Ruta encontrada: {match}")
except Resolver404:
    print(f"   ❌ Ruta no encontrada")

print("\n" + "=" * 80)

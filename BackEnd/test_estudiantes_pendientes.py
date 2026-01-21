#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from publications.models import StudentOpinion, TutorStudent
from publications.serializers import TutorStudentSerializer

User = get_user_model()

print("=" * 100)
print("🔍 DIAGNÓSTICO DETALLADO: Bug del Selector de Estudiantes (Off-by-One)")
print("=" * 100)

# Obtener el tutor
try:
    tutor = User.objects.get(username='jorge', role='tutor')
except:
    try:
        tutor = User.objects.filter(role='tutor').first()
    except:
        print("❌ No se encontró un tutor")
        exit(1)

print(f"\n📌 Tutor seleccionado para prueba: {tutor.get_full_name()} (ID: {tutor.id})")

# 1. Contar todos los TutorStudent activos
all_tutored = TutorStudent.objects.filter(tutor=tutor, is_active=True)
print(f"\n1️⃣ TutorStudent ACTIVOS (todos): {all_tutored.count()}")
for i, ts in enumerate(all_tutored, 1):
    print(f"   {i}. {ts.student.get_full_name()} (ID: {ts.student.id}) - is_active: {ts.is_active}")

# 2. Obtener IDs de estudiantes que ya tienen opinión
with_opinion = StudentOpinion.objects.filter(tutor=tutor).values_list('student_id', flat=True)
print(f"\n2️⃣ Estudiantes CON OPINIÓN: {with_opinion.count()}")
for student_id in with_opinion:
    student = User.objects.get(id=student_id)
    print(f"   • {student.get_full_name()} (ID: {student.id})")

# 3. Calcular pendientes CORRECTAMENTE
pending = TutorStudent.objects.filter(
    tutor=tutor,
    is_active=True
).exclude(
    student_id__in=with_opinion
).select_related('student')

print(f"\n3️⃣ Estudiantes PENDIENTES (sin opinión): {pending.count()}")
print(f"   Cálculo: {all_tutored.count()} (total) - {with_opinion.count()} (con opinión) = {pending.count()}")
for i, ts in enumerate(pending, 1):
    print(f"   {i}. {ts.student.get_full_name()} (ID: {ts.student.id})")

# 4. Serializar los datos
print(f"\n4️⃣ Datos SERIALIZADOS (como los devuelve el API):")
serializer = TutorStudentSerializer(pending, many=True)
data = serializer.data
print(f"   Total de items en serializer.data: {len(data)}")
for i, item in enumerate(data, 1):
    print(f"   {i}. {item}")

# 5. Verificar si hay algún problema con duplicados o activos/inactivos
print(f"\n5️⃣ Análisis de DUPLICADOS e INCONSISTENCIAS:")
all_ids = [ts.id for ts in all_tutored]
pending_ids = [ts.id for ts in pending]
print(f"   IDs de todos los TutorStudent: {all_ids}")
print(f"   IDs de los pendientes: {pending_ids}")
print(f"   ¿Todos los pendientes están en todos?: {set(pending_ids).issubset(set(all_ids))}")

# 6. Verificar si hay inactivos
inactive = TutorStudent.objects.filter(tutor=tutor, is_active=False)
print(f"\n6️⃣ Estudiantes INACTIVOS: {inactive.count()}")
for ts in inactive:
    print(f"   • {ts.student.get_full_name()} (is_active: {ts.is_active})")

print("\n" + "=" * 100)
print("RESUMEN:")
print(f"  ✓ Total asignados: {all_tutored.count()}")
print(f"  ✓ Con opinión: {with_opinion.count()}")
print(f"  ✓ Pendientes: {pending.count()}")
print(f"  ✓ Inactivos: {inactive.count()}")
print(f"  ✓ Serializados: {len(data)}")
print("=" * 100)

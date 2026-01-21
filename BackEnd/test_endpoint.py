#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from publications.models import StudentOpinion, TutorStudent

User = get_user_model()

# Get jefe user
jefe_user = User.objects.filter(role='jefe').first()
print(f"\n✅ Jefe usuario encontrado: {jefe_user}")

# Check StudentOpinion table
opiniones_count = StudentOpinion.objects.count()
print(f"📊 Total opiniones en BD: {opiniones_count}")

opiniones_list = StudentOpinion.objects.all()
for op in opiniones_list:
    print(f"  → Tutor: {op.tutor.get_full_name()}, Estudiante: {op.student.get_full_name()}")

# Check TutorStudent table
tutores_count = TutorStudent.objects.count()
print(f"📊 Total TutorStudent en BD: {tutores_count}")

# Check what jefe should see (filter by role)
if jefe_user:
    print(f"\n🔍 Filtrando opiniones para jefe:")
    jefe_opiniones = StudentOpinion.objects.filter()  # Jefe ve todas
    print(f"   - Opiniones para jefe: {jefe_opiniones.count()}")
    
print("\n✅ Test completado")

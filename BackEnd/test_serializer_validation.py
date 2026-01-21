#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from publications.serializers import PublicationCreateSerializer

User = get_user_model()

print('\n' + '='*80)
print('🧪 PRUEBA: Validación del Serializer - Intentar usar JEFE como tutor')
print('='*80)

jefe = User.objects.get(role='jefe')
student = User.objects.filter(role='estudiante').first()
tutor = User.objects.filter(role='tutor').first()

print(f'\n📌 Datos de prueba:')
print(f'   Estudiante: {student.get_full_name()} (ID: {student.id})')
print(f'   Jefe intento: {jefe.get_full_name()} (ID: {jefe.id}, rol: {jefe.role})')

# Intentar crear una publicación con jefe como tutor
data = {
    'titulo': 'Test Publicación',
    'autores': 'Test Author',
    'nivel': 1,
    'tutor': jefe.id  # Intentar usar jefe como tutor
}

class FakeRequest:
    pass

context = {'request': FakeRequest()}
serializer = PublicationCreateSerializer(data=data, context=context)

print(f'\n🔍 Intentando validar con tutor=jefe (ID: {jefe.id})...')
if serializer.is_valid():
    print(f'   ✗ VALIDACIÓN PASÓ (MALO - Debería fallar)')
else:
    print(f'   ✅ VALIDACIÓN FALLÓ (CORRECTO)')
    print(f'   Errores:')
    for field, errors in serializer.errors.items():
        for error in errors:
            print(f'     - {field}: {error}')

print('\n' + '='*80)

# Ahora intentar con un tutor válido
print(f'\n📌 Prueba con TUTOR válido:')
print(f'   Tutor: {tutor.get_full_name()} (ID: {tutor.id}, rol: {tutor.role})')

data2 = {
    'titulo': 'Test Publicación 2',
    'autores': 'Test Author 2',
    'nivel': 1,
    'tutor': tutor.id
}

serializer2 = PublicationCreateSerializer(data=data2, context=context)

print(f'\n🔍 Intentando validar con tutor válido (ID: {tutor.id})...')
if serializer2.is_valid():
    print(f'   ✅ VALIDACIÓN PASÓ (CORRECTO)')
else:
    print(f'   ✗ VALIDACIÓN FALLÓ (MALO)')
    print(f'   Errores:')
    for field, errors in serializer2.errors.items():
        for error in errors:
            print(f'     - {field}: {error}')

print('\n' + '='*80)

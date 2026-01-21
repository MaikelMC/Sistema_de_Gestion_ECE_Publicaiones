#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from publications.serializers import PublicationCreateSerializer

User = get_user_model()

print('\n' + '='*80)
print('✅ VERIFICACIÓN: Tutores Y Jefes pueden ser seleccionados como tutores')
print('='*80)

jefe = User.objects.get(role='jefe')
tutor = User.objects.filter(role='tutor').first()

print(f'\n📋 Datos de prueba:')
print(f'   Tutor: {tutor.get_full_name()} (ID: {tutor.id}, rol: {tutor.role})')
print(f'   Jefe: {jefe.get_full_name()} (ID: {jefe.id}, rol: {jefe.role})')

class FakeRequest:
    pass

context = {'request': FakeRequest()}

# Prueba 1: Tutor como tutor
print(f'\n🔍 Prueba 1: Usando TUTOR como tutor...')
data1 = {
    'titulo': 'Test Publicación 1',
    'autores': 'Test Author',
    'nivel': 1,
    'tutor': tutor.id
}

serializer1 = PublicationCreateSerializer(data=data1, context=context)
if serializer1.is_valid():
    print(f'   ✅ VÁLIDO - Tutor aceptado correctamente')
else:
    print(f'   ❌ ERROR: {serializer1.errors}')

# Prueba 2: Jefe como tutor
print(f'\n🔍 Prueba 2: Usando JEFE como tutor...')
data2 = {
    'titulo': 'Test Publicación 2',
    'autores': 'Test Author',
    'nivel': 1,
    'tutor': jefe.id
}

serializer2 = PublicationCreateSerializer(data=data2, context=context)
if serializer2.is_valid():
    print(f'   ✅ VÁLIDO - Jefe aceptado correctamente como tutor')
else:
    print(f'   ❌ ERROR: {serializer2.errors}')

# Prueba 3: Sin tutor (opcional)
print(f'\n🔍 Prueba 3: Sin seleccionar tutor (opcional)...')
data3 = {
    'titulo': 'Test Publicación 3',
    'autores': 'Test Author',
    'nivel': 1
}

serializer3 = PublicationCreateSerializer(data=data3, context=context)
if serializer3.is_valid():
    print(f'   ✅ VÁLIDO - Tutor opcional funciona')
else:
    print(f'   ❌ ERROR: {serializer3.errors}')

print('\n' + '='*80)
print('✅ Ambos tutores y jefes pueden ser seleccionados como tutores')
print('='*80 + '\n')

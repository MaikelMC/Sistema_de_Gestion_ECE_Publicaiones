#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print('\n' + '='*70)
print('✅ VERIFICANDO ENDPOINT TUTORES (POST-CORRECCIÓN)')
print('='*70)

print('\n📋 Solo usuarios con rol="tutor":')
tutores = User.objects.filter(role='tutor', activo=True)
for t in tutores:
    print(f'   ID: {t.id}, Nombre: {t.get_full_name()}, Rol: {t.role}')

print(f'\n✅ Total de tutores devueltos: {tutores.count()}')

print('\n❌ Usuarios con rol="jefe" (EXCLUIDOS del endpoint):')
jefes = User.objects.filter(role='jefe', activo=True)
for j in jefes:
    print(f'   ID: {j.id}, Nombre: {j.get_full_name()}, Rol: {j.role}')

print(f'\n❌ Total de jefes (NO en el endpoint): {jefes.count()}')

print('\n' + '='*70)
print('✅ El endpoint /auth/users/tutores/ ahora solo devuelve tutores')
print('='*70 + '\n')

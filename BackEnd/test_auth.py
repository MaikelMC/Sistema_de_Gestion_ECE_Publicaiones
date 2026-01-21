#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model, authenticate

User = get_user_model()

# Test jefe login
jefe = User.objects.filter(role='jefe').first()
print(f"Usuario: {jefe.username}")
print(f"Email: {jefe.email}")

# Try to authenticate
user = authenticate(username='antonio', password='password123')
if user:
    print(f"✅ Autenticación exitosa: {user}")
else:
    print("❌ Autenticación falló")

# Try other passwords
passwords_to_test = ['password123', 'Antonio123', 'antonio123', '12345678']
for pwd in passwords_to_test:
    user = authenticate(username='antonio', password=pwd)
    if user:
        print(f"✅ ¡Contraseña correcta encontrada!: {pwd}")
        break
else:
    print("❌ Ninguna contraseña funcionó")

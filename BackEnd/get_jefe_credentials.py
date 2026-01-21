#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Get jefe users
jefes = User.objects.filter(role='jefe')
for jefe in jefes:
    print(f"Jefe encontrado:")
    print(f"  - Username: {jefe.username}")
    print(f"  - Email: {jefe.email}")
    print(f"  - Nombre: {jefe.get_full_name()}")
    print(f"  - ID: {jefe.id}")
    print(f"  - Rol: {jefe.role}")
    print()

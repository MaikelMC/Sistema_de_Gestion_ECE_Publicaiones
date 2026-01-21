#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

try:
    jefe = User.objects.get(username='antonio')
    
    print(f"Estado ANTES del desbloqueo:")
    print(f"  Username: {jefe.username}")
    print(f"  ID: {jefe.id}")
    print(f"  Rol: {jefe.role}")
    print(f"  Locked Until: {jefe.locked_until}")
    print(f"  Failed Login Attempts: {jefe.failed_login_attempts}")
    
    # Unlock the account
    jefe.locked_until = timezone.now() - timedelta(hours=1)
    jefe.failed_login_attempts = 0
    jefe.save()
    
    print(f"\n✅ Usuario {jefe.username} desbloqueado exitosamente")
    print(f"\nEstado DESPUÉS del desbloqueo:")
    print(f"  Locked Until: {jefe.locked_until}")
    print(f"  Failed Login Attempts: {jefe.failed_login_attempts}")
    
except User.DoesNotExist:
    print("❌ Usuario 'antonio' no encontrado")
except Exception as e:
    print(f"❌ Error: {e}")

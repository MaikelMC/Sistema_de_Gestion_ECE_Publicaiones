#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

print("🔐 Probando autenticación con usuario antonio...")

try:
    jefe = User.objects.get(username='antonio')
    
    print(f"✅ Usuario encontrado: {jefe.username} (ID: {jefe.id})")
    print(f"  Rol: {jefe.role}")
    print(f"  Locked Until: {jefe.locked_until}")
    print(f"  Failed Login Attempts: {jefe.failed_login_attempts}")
    
    # Verificar si la contraseña es correcta
    if jefe.check_password('Antonio1234'):
        print(f"✅ Contraseña correcta!")
        
        # Generar tokens
        refresh = RefreshToken.for_user(jefe)
        access_token = str(refresh.access_token)
        
        print(f"✅ Tokens generados exitosamente")
        print(f"  Access Token: {access_token[:50]}...")
        print(f"\n🔍 Ahora puedes usar estos tokens para acceder a la API")
        print(f"✅ El usuario jefe debería poder acceder a OpinionesJefe correctamente")
    else:
        print(f"❌ Contraseña incorrecta")
        
except User.DoesNotExist:
    print("❌ Usuario 'antonio' no encontrado")
except Exception as e:
    print(f"❌ Error: {e}")

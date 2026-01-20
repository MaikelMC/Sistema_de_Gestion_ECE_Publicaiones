"""
Script para limpiar los bloqueos de IP en el sistema.
Útil cuando te quedas bloqueado durante el desarrollo.
"""
import os
import django
import sys

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SECRET_KEY', 'django-insecure-default-key')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from authentication.models import FailedLoginIP, User
from django.utils import timezone

def clear_all_ip_blocks():
    """Elimina todos los bloqueos de IP"""
    deleted_count = FailedLoginIP.objects.all().delete()[0]
    print(f"✅ Se eliminaron {deleted_count} registros de bloqueo de IP")
    return deleted_count

def clear_specific_ip(ip_address):
    """Elimina el bloqueo de una IP específica"""
    try:
        ip_record = FailedLoginIP.objects.get(ip_address=ip_address)
        ip_record.delete()
        print(f"✅ Se desbloqueó la IP: {ip_address}")
        return True
    except FailedLoginIP.DoesNotExist:
        print(f"⚠️ No se encontró bloqueo para la IP: {ip_address}")
        return False

def reset_ip_attempts():
    """Resetea los intentos y desbloquea todas las IPs sin eliminar registros"""
    updated = FailedLoginIP.objects.all().update(
        attempts=0,
        blocked_until=None,
        last_attempt=None
    )
    print(f"✅ Se resetearon {updated} registros de IP")
    return updated

def clear_user_locks():
    """Desbloquea todos los usuarios bloqueados"""
    updated = User.objects.filter(locked_until__isnull=False).update(
        failed_login_attempts=0,
        locked_until=None
    )
    print(f"✅ Se desbloquearon {updated} usuarios")
    return updated

def list_blocked_ips():
    """Lista todas las IPs bloqueadas"""
    blocked = FailedLoginIP.objects.filter(blocked_until__gt=timezone.now())
    if not blocked.exists():
        print("✅ No hay IPs bloqueadas actualmente")
        return []
    
    print(f"🔒 IPs bloqueadas ({blocked.count()}):")
    for record in blocked:
        print(f"  - IP: {record.ip_address}")
        print(f"    Intentos: {record.attempts}")
        print(f"    Último intento: {record.last_attempt}")
        print(f"    Bloqueada hasta: {record.blocked_until}")
        print()
    return list(blocked)

def list_all_ips():
    """Lista todas las IPs registradas"""
    all_ips = FailedLoginIP.objects.all()
    if not all_ips.exists():
        print("✅ No hay IPs registradas")
        return []
    
    print(f"📋 Todas las IPs registradas ({all_ips.count()}):")
    for record in all_ips:
        status = "🔒 BLOQUEADA" if (record.blocked_until and record.blocked_until > timezone.now()) else "✅ Activa"
        print(f"  {status} - IP: {record.ip_address} | Intentos: {record.attempts}")
    print()
    return list(all_ips)

if __name__ == '__main__':
    print("=" * 60)
    print("🔧 Script de limpieza de bloqueos de IP")
    print("=" * 60)
    print()
    
    # Listar estado actual
    print("📊 Estado actual:")
    list_all_ips()
    
    # Limpiar todos los bloqueos
    print("\n🧹 Limpiando bloqueos...")
    clear_all_ip_blocks()
    clear_user_locks()
    
    print("\n✅ Proceso completado. Ahora puedes intentar iniciar sesión nuevamente.")

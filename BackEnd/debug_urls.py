"""
Script de diagnóstico para verificar cómo se registran las rutas
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver
from django.apps import apps as dj_apps
import importlib

print("=" * 80)
print("DIAGNÓSTICO DE RUTAS - Sistema ECE")
print("=" * 80)

# 1. Verificar que la app 'requests' está instalada
print("\n1. APPS INSTALADAS:")
try:
    req_app = dj_apps.get_app_config('requests')
    print(f"   ✓ App 'requests' encontrada: {req_app.name}")
    print(f"   ✓ Path: {req_app.path}")
except Exception as e:
    print(f"   ✗ Error obteniendo app 'requests': {e}")

# 2. Verificar que SystemLogViewSet existe
print("\n2. VERIFICAR SystemLogViewSet:")
try:
    req_app = dj_apps.get_app_config('requests')
    req_views = importlib.import_module(f"{req_app.name}.views")
    SystemLogViewSet = getattr(req_views, 'SystemLogViewSet', None)
    if SystemLogViewSet:
        print(f"   ✓ SystemLogViewSet encontrado: {SystemLogViewSet}")
    else:
        print("   ✗ SystemLogViewSet no encontrado en requests.views")
except Exception as e:
    print(f"   ✗ Error importando SystemLogViewSet: {e}")

# 3. Verificar rutas registradas
print("\n3. RUTAS REGISTRADAS (que contienen 'system-log' o 'requests'):")
resolver = get_resolver()

def print_urls(urlpatterns, prefix=''):
    for pattern in urlpatterns:
        if hasattr(pattern, 'url_patterns'):
            # Es un include, recursivo
            new_prefix = prefix + str(pattern.pattern)
            print_urls(pattern.url_patterns, new_prefix)
        else:
            full_pattern = prefix + str(pattern.pattern)
            if 'system' in full_pattern.lower() or 'request' in full_pattern.lower():
                callback = getattr(pattern, 'callback', None)
                name = getattr(pattern, 'name', 'sin-nombre')
                print(f"   → {full_pattern:60s} [{name}]")
                if callback:
                    print(f"      Callback: {callback}")

print_urls(resolver.url_patterns)

# 4. Probar resolución de rutas específicas
print("\n4. PRUEBA DE RESOLUCIÓN DE RUTAS:")
test_paths = [
    '/api/requests/',
    '/api/requests/system-logs/',
    '/api/system-logs/',
]

from django.urls import resolve
from django.urls.exceptions import Resolver404

for path in test_paths:
    try:
        match = resolve(path)
        print(f"   ✓ {path:40s} → {match.func} [{match.url_name}]")
    except Resolver404:
        print(f"   ✗ {path:40s} → 404 (No encontrado)")
    except Exception as e:
        print(f"   ✗ {path:40s} → Error: {e}")

print("\n" + "=" * 80)
print("FIN DEL DIAGNÓSTICO")
print("=" * 80)

from django.core.management.base import BaseCommand
from django.urls import get_resolver
from django.apps import apps as dj_apps
import importlib


class Command(BaseCommand):
    help = 'Diagnóstico de rutas del sistema'

    def handle(self, *args, **options):
        self.stdout.write("=" * 80)
        self.stdout.write("DIAGNÓSTICO DE RUTAS - Sistema ECE")
        self.stdout.write("=" * 80)

        # 1. Verificar app requests
        self.stdout.write("\n1. APP 'requests':")
        try:
            req_app = dj_apps.get_app_config('requests')
            self.stdout.write(self.style.SUCCESS(f"   ✓ App encontrada: {req_app.name}"))
            self.stdout.write(f"   Path: {req_app.path}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ✗ Error: {e}"))

        # 2. Verificar SystemLogViewSet
        self.stdout.write("\n2. SystemLogViewSet:")
        try:
            req_app = dj_apps.get_app_config('requests')
            req_views = importlib.import_module(f"{req_app.name}.views")
            SystemLogViewSet = getattr(req_views, 'SystemLogViewSet', None)
            if SystemLogViewSet:
                self.stdout.write(self.style.SUCCESS(f"   ✓ Encontrado: {SystemLogViewSet}"))
            else:
                self.stdout.write(self.style.ERROR("   ✗ No encontrado"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ✗ Error: {e}"))

        # 3. Rutas registradas
        self.stdout.write("\n3. RUTAS RELEVANTES:")
        resolver = get_resolver()
        self.print_patterns(resolver.url_patterns, '')

        # 4. Probar resolución
        self.stdout.write("\n4. PRUEBA DE RESOLUCIÓN:")
        from django.urls import resolve
        from django.urls.exceptions import Resolver404

        test_paths = [
            'api/requests/',
            'api/requests/system-logs/',
            'api/system-logs/',
        ]

        for path in test_paths:
            try:
                match = resolve(f'/{path}')
                self.stdout.write(self.style.SUCCESS(f"   ✓ /{path:40s} → {match.url_name}"))
            except Resolver404:
                self.stdout.write(self.style.ERROR(f"   ✗ /{path:40s} → 404"))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"   ? /{path:40s} → {e}"))

        self.stdout.write("\n" + "=" * 80)

    def print_patterns(self, patterns, prefix='', level=0):
        """Imprime patrones de URL recursivamente"""
        if level > 3:  # Evitar recursión infinita
            return
        
        for pattern in patterns:
            full_pattern = prefix + str(pattern.pattern)
            
            # Solo mostrar rutas relevantes
            if any(keyword in full_pattern.lower() for keyword in ['request', 'system', 'log']):
                indent = "   " * level
                self.stdout.write(f"{indent}→ {full_pattern}")
            
            # Si tiene subpatrones, procesarlos recursivamente
            if hasattr(pattern, 'url_patterns'):
                self.print_patterns(pattern.url_patterns, full_pattern, level + 1)

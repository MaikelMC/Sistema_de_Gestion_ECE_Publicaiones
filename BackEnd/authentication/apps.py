from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
    
    def ready(self):
        """Importar señales para registrar hooks de auditoría y seguridad"""
        try:
            from . import signals  # noqa: F401
            print("[AuthenticationConfig] Signals importados correctamente")
        except Exception as e:
            print(f"[AuthenticationConfig] Error importando signals: {e}")
            import traceback
            traceback.print_exc()

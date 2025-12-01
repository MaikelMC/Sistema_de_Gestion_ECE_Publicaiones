from django.http import HttpResponseForbidden
from django.conf import settings


# Import helper de logging de la app `requests` (silencioso si falla)
try:
    from requests.utils import log_event
except Exception:
    log_event = None


def get_client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        # X-Forwarded-For: client, proxy1, proxy2
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class AdminIPRestrictionMiddleware:
    """Middleware que restringe el acceso a rutas administrativas por IP.

    Comportamiento:
    - Si `request.path` comienza con `/admin` (ruta del admin de Django), comprueba
      si la IP cliente está dentro de `settings.ALLOW_ADMIN_IPS`.
    - `ALLOW_ADMIN_IPS` puede ser una lista de strings con IPs o CIDR ranges.
      Actualmente el middleware soporta coincidencias exactas. Para CIDR
      podríamos extender con ipaddress.ip_network checks.
    - Si `ALLOW_ADMIN_IPS` está vacío, no se aplica la restricción (útil en dev).
    """

    def __init__(self, get_response):
        self.get_response = get_response
        raw = getattr(settings, 'ALLOW_ADMIN_IPS', None)
        # Normalizar a lista
        if raw is None:
            self.allow_list = []
        elif isinstance(raw, (list, tuple)):
            self.allow_list = list(raw)
        else:
            # permitir pasar como cadena separada por comas
            self.allow_list = [ip.strip() for ip in str(raw).split(',') if ip.strip()]

    def __call__(self, request):
        path = request.path or ''
        # Solo aplicar a rutas de admin
        if path.startswith('/admin'):
            # Si no hay lista configurada, permitir (no bloquear en dev)
            if not self.allow_list:
                return self.get_response(request)

            ip = get_client_ip(request)
            # comprobación simple: coincidencia exacta con elementos de allow_list
            if ip not in self.allow_list:
                # Registrar en SystemLog si el helper está disponible
                try:
                    if log_event:
                        log_event(user=None, request=request, action='admin_ip_deny', model_name='Admin', object_id=None,
                                  description=f"Acceso a {path} denegado desde IP {ip}")
                    else:
                        # Intentar un guardado directo evitando import circular
                        from django.apps import apps
                        SystemLog = None
                        try:
                            SystemLog = apps.get_model('requests', 'SystemLog')
                        except Exception:
                            SystemLog = None
                        if SystemLog:
                            SystemLog.objects.create(user=None, action='admin_ip_deny', model_name='Admin', object_id=None,
                                                     description=f"Acceso a {path} denegado desde IP {ip}", ip_address=ip,
                                                     user_agent=request.META.get('HTTP_USER_AGENT'))
                except Exception:
                    # No interrumpir la respuesta aunque falle el log
                    pass

                return HttpResponseForbidden('Acceso denegado desde su dirección IP.')

        return self.get_response(request)

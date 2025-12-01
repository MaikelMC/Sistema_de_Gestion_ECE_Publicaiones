"""
Middleware para auditoría de errores y accesos no autorizados
"""
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
import traceback
import sys


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware que registra:
    - Errores del sistema (500)
    - Errores de BD
    - Intentos de acceso no autorizado (403, 401)
    """
    
    def process_exception(self, request, exception):
        """Capturar excepciones y registrarlas"""
        try:
            from requests.utils import log_event, create_notification
            from django.db import DatabaseError
            
            user = getattr(request, 'user', None)
            if user and not user.is_authenticated:
                user = None
            
            # Determinar tipo de error
            is_db_error = isinstance(exception, DatabaseError)
            action = 'db_error' if is_db_error else 'system_error'
            
            # Descripción detallada del error
            error_type = type(exception).__name__
            error_msg = str(exception)
            error_trace = ''.join(traceback.format_exception(*sys.exc_info()))
            
            description = f"{error_type}: {error_msg}\nPath: {request.path}\nMethod: {request.method}"
            
            # Log del error
            log_event(
                user=user,
                request=request,
                action=action,
                model_name='System',
                object_id=None,
                description=description[:500]  # Limitar tamaño
            )
            
            # Crear notificación para errores críticos
            if create_notification:
                create_notification(
                    notification_type='db_error' if is_db_error else 'system_error',
                    severity='critical',
                    title=f'Error crítico: {error_type}',
                    message=f'{error_msg[:200]}\nRuta: {request.path}',
                    user=user,
                    request=request,
                    metadata={
                        'error_type': error_type,
                        'path': request.path,
                        'method': request.method,
                        'trace_preview': error_trace[:500]
                    }
                )
            
        except Exception as log_error:
            # No interrumpir el flujo si el logging falla
            print(f"Error al registrar auditoría: {log_error}")
        
        # No modificar el comportamiento normal de Django
        return None
    
    def process_response(self, request, response):
        """Capturar respuestas 401/403 (acceso no autorizado)"""
        if response.status_code in [401, 403]:
            try:
                from requests.utils import log_event, create_notification
                
                user = getattr(request, 'user', None)
                if user and not user.is_authenticated:
                    user = None
                
                # Determinar si es acceso denegado o no autenticado
                status_desc = {
                    401: 'No autenticado',
                    403: 'Acceso denegado'
                }
                
                description = (
                    f"{status_desc.get(response.status_code, 'Acceso no autorizado')}\n"
                    f"Path: {request.path}\n"
                    f"Method: {request.method}\n"
                    f"User: {user.username if user else 'Anonymous'}"
                )
                
                log_event(
                    user=user,
                    request=request,
                    action='unauthorized_attempt',
                    model_name='Access',
                    object_id=None,
                    description=description
                )
                
                # Notificación para intentos no autorizados (solo 403, no 401)
                if response.status_code == 403 and create_notification:
                    create_notification(
                        notification_type='unauthorized_attempt',
                        severity='warning',
                        title=f'Acceso denegado: {request.path}',
                        message=f'Usuario {user.username if user else "anónimo"} intentó acceder a {request.path}',
                        user=user,
                        request=request,
                        metadata={'path': request.path, 'method': request.method}
                    )
                
            except Exception as log_error:
                # No interrumpir el flujo
                print(f"Error al registrar intento no autorizado: {log_error}")
        
        return response

"""
Middleware de seguridad para datos sensibles
Agrega headers para evitar caché en el navegador
"""
from django.utils.deprecation import MiddlewareMixin


class NoCacheMiddleware(MiddlewareMixin):
    """
    Middleware que agrega headers para prevenir el caché de datos sensibles
    Se aplica a todas las respuestas de API
    """
    
    def process_response(self, request, response):
        """
        Agregar headers de no-caché a respuestas de API
        """
        # Aplicar solo a endpoints de API (datos sensibles)
        if request.path.startswith('/api/'):
            # Headers para evitar caché en navegadores
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            # Headers adicionales de seguridad
            response['X-Content-Type-Options'] = 'nosniff'
            response['X-Frame-Options'] = 'DENY'
            response['X-XSS-Protection'] = '1; mode=block'
            
            # Evitar que el navegador infiera el tipo MIME
            if 'Content-Type' not in response:
                response['Content-Type'] = 'application/json'
        
        return response


class SecureFormMiddleware(MiddlewareMixin):
    """
    Middleware para forzar que las operaciones sensibles se hagan solo con POST
    """
    
    # Endpoints que deben usar solo POST para datos sensibles
    POST_ONLY_ENDPOINTS = [
        '/api/auth/login/',
        '/api/auth/register/',
        '/api/auth/change-password/',
        '/api/token/',
        '/api/token/refresh/',
    ]
    
    def process_request(self, request):
        """
        Validar que endpoints sensibles solo acepten POST
        """
        # Verificar si es un endpoint que debe ser POST-only
        for endpoint in self.POST_ONLY_ENDPOINTS:
            if request.path == endpoint and request.method not in ['POST', 'OPTIONS']:
                from django.http import JsonResponse
                return JsonResponse(
                    {'error': 'Este endpoint solo acepta método POST por razones de seguridad'},
                    status=405
                )
        
        return None

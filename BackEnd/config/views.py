from django.shortcuts import render
from django.http import HttpResponseServerError, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotFound
import logging

logger = logging.getLogger(__name__)

def custom_400(request, exception=None):
    """Return a custom 400 response using template."""
    context = {'message': 'Petición inválida'}
    return HttpResponseBadRequest(render(request, '400.html', context))

def custom_403(request, exception=None):
    """Return a custom 403 response using template."""
    context = {'message': 'Acceso denegado'}
    return HttpResponseForbidden(render(request, '403.html', context))

def custom_404(request, exception=None):
    """Return a custom 404 response using template."""
    context = {'message': 'Página no encontrada'}
    return HttpResponseNotFound(render(request, '404.html', context))

def custom_500(request):
    """Return a custom 500 response using template and log the exception."""
    # When DEBUG=False Django will call this handler on server errors.
    # Log the exception traceback if any
    logger.error('Internal server error (500) at %s', request.path, exc_info=True)
    return HttpResponseServerError(render(request, '500.html', {}))

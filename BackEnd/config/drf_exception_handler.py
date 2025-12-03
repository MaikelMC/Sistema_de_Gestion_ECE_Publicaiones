from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """Wrap DRF's exception handler to ensure a stable JSON response and log 500s."""
    # Call REST framework's default exception handler first
    response = drf_exception_handler(exc, context)

    if response is not None:
        # Optionally normalize response structure here
        return response

    # If DRF returned None, it's likely an unhandled exception -> 500
    request = context.get('request')
    logger.error('Unhandled exception in API view: %s %s', request.path if request else '', exc, exc_info=True)
    return Response({'detail': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ECERequestViewSet, SystemLogViewSet, SystemConfigurationViewSet
)
from .notification_views import AdminNotificationViewSet

router = DefaultRouter()
# IMPORTANTE: Registrar las rutas más específicas PRIMERO (system-logs, system-config)
# antes de registrar el ECERequestViewSet en la raíz (r''), para evitar que
# 'system-logs' sea capturado como un pk del ECERequest.
router.register(r'system-logs', SystemLogViewSet, basename='system-log')
router.register(r'system-config', SystemConfigurationViewSet, basename='system-config')
router.register(r'notifications', AdminNotificationViewSet, basename='notification')
# Register the ECERequest viewset at the app root so when included under
# `/api/requests/` it exposes `/api/requests/` for list/create and
# `/api/requests/{pk}/` for detail.
router.register(r'', ECERequestViewSet, basename='ece-request')

urlpatterns = router.urls
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ECERequestViewSet, SystemLogViewSet, SystemConfigurationViewSet
)

router = DefaultRouter()
# Register the ECERequest viewset at the app root so when included under
# `/api/requests/` it exposes `/api/requests/` for list/create and
# `/api/requests/{pk}/` for detail.
router.register(r'', ECERequestViewSet, basename='ece-request')
router.register(r'system-logs', SystemLogViewSet, basename='system-log')
router.register(r'system-config', SystemConfigurationViewSet, basename='system-config')

urlpatterns = router.urls
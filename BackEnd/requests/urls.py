from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    ECERequestViewSet, SystemLogViewSet, SystemConfigurationViewSet
)

router = DefaultRouter()
router.register(r'ece-requests', ECERequestViewSet, basename='ece-request')
router.register(r'system-logs', SystemLogViewSet, basename='system-log')
router.register(r'system-config', SystemConfigurationViewSet, basename='system-config')

urlpatterns = router.urls

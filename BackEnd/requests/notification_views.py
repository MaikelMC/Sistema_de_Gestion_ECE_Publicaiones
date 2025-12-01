"""
ViewSet para notificaciones del administrador
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import AdminNotification
from .serializers import AdminNotificationSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class AdminNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para notificaciones del administrador (solo lectura)
    Permite marcar como leído y resolver notificaciones
    """
    queryset = AdminNotification.objects.all()
    serializer_class = AdminNotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['notification_type', 'severity', 'is_read', 'is_resolved']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'severity']
    ordering = ['-created_at']
    pagination_class = None  # Desactivar paginación
    
    def get_queryset(self):
        """Solo admins pueden ver notificaciones"""
        if not self.request.user.is_authenticated:
            return AdminNotification.objects.none()
        if getattr(self.request.user, 'role', None) != 'admin':
            return AdminNotification.objects.none()
        return AdminNotification.objects.all()
    
    @swagger_auto_schema(
        operation_description="Obtener lista de notificaciones con filtros",
        manual_parameters=[
            openapi.Parameter('notification_type', openapi.IN_QUERY, description="Filtrar por tipo", type=openapi.TYPE_STRING),
            openapi.Parameter('severity', openapi.IN_QUERY, description="Filtrar por severidad", type=openapi.TYPE_STRING),
            openapi.Parameter('is_read', openapi.IN_QUERY, description="Filtrar por leídas", type=openapi.TYPE_BOOLEAN),
            openapi.Parameter('is_resolved', openapi.IN_QUERY, description="Filtrar por resueltas", type=openapi.TYPE_BOOLEAN),
        ],
        tags=['Notificaciones Admin']
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Marcar notificación como leída",
        responses={
            200: openapi.Response(
                description="Notificación marcada como leída",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'notification': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            403: "No autorizado"
        },
        tags=['Notificaciones Admin']
    )
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marcar notificación como leída"""
        if not request.user.is_authenticated or getattr(request.user, 'role', None) != 'admin':
            return Response({'error': 'Solo admins'}, status=status.HTTP_403_FORBIDDEN)
        
        notification = self.get_object()
        notification.mark_as_read()
        
        return Response({
            'message': 'Notificación marcada como leída',
            'notification': AdminNotificationSerializer(notification).data
        })
    
    @swagger_auto_schema(
        operation_description="Resolver notificación",
        responses={
            200: openapi.Response(
                description="Notificación resuelta",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'notification': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            403: "No autorizado"
        },
        tags=['Notificaciones Admin']
    )
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolver notificación"""
        if not request.user.is_authenticated or getattr(request.user, 'role', None) != 'admin':
            return Response({'error': 'Solo admins'}, status=status.HTTP_403_FORBIDDEN)
        
        notification = self.get_object()
        notification.resolve()
        
        return Response({
            'message': 'Notificación resuelta',
            'notification': AdminNotificationSerializer(notification).data
        })
    
    @swagger_auto_schema(
        operation_description="Obtener estadísticas de notificaciones",
        responses={
            200: openapi.Response(
                description="Estadísticas",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'total': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'unread': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'pending': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'by_severity': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'by_type': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            403: "No autorizado"
        },
        tags=['Notificaciones Admin']
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de notificaciones"""
        if not request.user.is_authenticated or getattr(request.user, 'role', None) != 'admin':
            return Response({'error': 'Solo admins'}, status=status.HTTP_403_FORBIDDEN)
        
        queryset = self.get_queryset()
        
        from django.db.models import Count
        
        stats = {
            'total': queryset.count(),
            'unread': queryset.filter(is_read=False).count(),
            'pending': queryset.filter(is_read=True, is_resolved=False).count(),
            'resolved': queryset.filter(is_resolved=True).count(),
            'by_severity': dict(queryset.values('severity').annotate(count=Count('id')).values_list('severity', 'count')),
            'by_type': dict(queryset.values('notification_type').annotate(count=Count('id')).values_list('notification_type', 'count'))
        }
        
        return Response(stats)

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import ECERequest, SystemLog, SystemConfiguration, AdminNotification
from .serializers import (
    ECERequestSerializer, ECERequestCreateSerializer, ECERequestReviewSerializer,
    ECERequestDetailSerializer, SystemLogSerializer, SystemLogCreateSerializer,
    SystemConfigurationSerializer, AdminNotificationSerializer
)
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
try:
    from .utils import log_event
except Exception:
    log_event = None


class ECERequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de solicitudes ECE
    """
    queryset = ECERequest.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'student', 'reviewed_by']
    search_fields = ['description', 'student__username', 'student__matricula']
    ordering_fields = ['created_at', 'review_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ECERequestCreateSerializer
        elif self.action == 'retrieve':
            return ECERequestDetailSerializer
        return ECERequestSerializer
    
    @swagger_auto_schema(
        operation_description="Obtener lista de solicitudes ECE con filtros",
        manual_parameters=[
            openapi.Parameter('status', openapi.IN_QUERY, description="Filtrar por estado", type=openapi.TYPE_STRING),
            openapi.Parameter('student', openapi.IN_QUERY, description="Filtrar por estudiante", type=openapi.TYPE_INTEGER),
            openapi.Parameter('reviewed_by', openapi.IN_QUERY, description="Filtrar por revisor", type=openapi.TYPE_INTEGER),
            openapi.Parameter('search', openapi.IN_QUERY, description="Búsqueda en descripción, username o matrícula", type=openapi.TYPE_STRING),
        ],
        tags=['Solicitudes ECE']
    )
    def get_queryset(self):
        user = self.request.user
        queryset = ECERequest.objects.select_related('student', 'reviewed_by').all()
        
        # Filtrar según rol
        if user.role == 'estudiante':
            queryset = queryset.filter(student=user)
        # Jefes y admins ven todas las solicitudes
        elif user.role in ['jefe', 'admin']:
            pass  # Ven todas las solicitudes
        
        return queryset
    
    @swagger_auto_schema(
        operation_description="Obtener solicitudes del estudiante actual",
        responses={200: ECERequestSerializer(many=True)},
        tags=['Solicitudes ECE - Estudiantes']
    )
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Obtener solicitudes del estudiante actual"""
        if request.user.role != 'estudiante':
            return Response({'error': 'Solo estudiantes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        requests_qs = self.get_queryset().filter(student=request.user)
        serializer = ECERequestSerializer(requests_qs, many=True, context={'request': request})
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Obtener solicitudes pendientes de revisión (para jefe)",
        responses={200: ECERequestSerializer(many=True)},
        tags=['Solicitudes ECE - Jefes']
    )
    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """Obtener solicitudes pendientes de revisión (para jefe)"""
        if request.user.role != 'jefe':
            return Response({'error': 'Solo jefes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        requests_qs = ECERequest.objects.filter(status__in=['en_proceso', 'pendiente'])
        serializer = ECERequestSerializer(requests_qs, many=True, context={'request': request})
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Revisar una solicitud ECE (para jefe de departamento)",
        request_body=ECERequestReviewSerializer,
        responses={
            200: openapi.Response(
                description="Solicitud revisada exitosamente",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'request': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            403: "No autorizado",
            400: "Datos inválidos"
        },
        tags=['Solicitudes ECE - Jefes']
    )
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Revisar una solicitud ECE (para jefe de departamento)"""
        if request.user.role != 'jefe':
            return Response({'error': 'Solo jefes pueden revisar'}, status=status.HTTP_403_FORBIDDEN)
        
        ece_request = self.get_object()
        serializer = ECERequestReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(ece_request=ece_request, reviewer=request.user)
        
        # Crear log
        # Registrar en SystemLog usando helper central
        try:
            if log_event:
                log_event(user=request.user, request=request, action='review', model_name='ECERequest', object_id=ece_request.id,
                          description=f"Revisión de solicitud ECE: {'Aprobada' if serializer.validated_data['is_approved'] else 'Rechazada'}")
            else:
                SystemLog.objects.create(
                    user=request.user,
                    action='review',
                    model_name='ECERequest',
                    object_id=ece_request.id,
                    description=f"Revisión de solicitud ECE: {'Aprobada' if serializer.validated_data['is_approved'] else 'Rechazada'}",
                    ip_address=self.get_client_ip(request)
                )
        except Exception:
            pass
        
        return Response({
            'message': 'Solicitud revisada exitosamente',
            'request': ECERequestSerializer(ece_request, context={'request': request}).data
        }, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        operation_description="Enviar solicitud para revisión",
        responses={
            200: openapi.Response(
                description="Solicitud enviada para revisión",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'request': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            403: "No autorizado",
            400: "La solicitud no está en proceso"
        },
        tags=['Solicitudes ECE - Estudiantes']
    )
    @action(detail=True, methods=['post'])
    def submit_for_review(self, request, pk=None):
        """Enviar solicitud para revisión"""
        ece_request = self.get_object()
        
        if ece_request.student != request.user:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        
        if ece_request.status != 'en_proceso':
            return Response({'error': 'La solicitud no está en proceso'}, status=status.HTTP_400_BAD_REQUEST)
        
        ece_request.status = 'pendiente'
        ece_request.save()
        
        return Response({
            'message': 'Solicitud enviada para revisión',
            'request': ECERequestSerializer(ece_request, context={'request': request}).data
        }, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        operation_description="Obtener estadísticas de solicitudes ECE",
        responses={
            200: openapi.Response(
                description="Estadísticas de solicitudes ECE",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'total': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'pendientes': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'aprobadas': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'rechazadas': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'estudiantes_activos': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'tasa_aprobacion': openapi.Schema(type=openapi.TYPE_NUMBER)
                    }
                )
            )
        },
        tags=['Solicitudes ECE - Estadísticas']
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de solicitudes ECE"""
        from django.db.models import Count
        from authentication.models import User
        
        # Estadísticas generales
        total = ECERequest.objects.count()
        pendientes = ECERequest.objects.filter(status__in=['en_proceso', 'pendiente']).count()
        aprobadas = ECERequest.objects.filter(status='aprobada').count()
        rechazadas = ECERequest.objects.filter(status='rechazada').count()
        
        # Estudiantes con solicitudes
        estudiantes_con_solicitudes = ECERequest.objects.values('student').distinct().count()
        
        return Response({
            'total': total,
            'pendientes': pendientes,
            'aprobadas': aprobadas,
            'rechazadas': rechazadas,
            'estudiantes_activos': estudiantes_con_solicitudes,
            'tasa_aprobacion': round((aprobadas / total * 100) if total > 0 else 0, 2)
        })
    
    @swagger_auto_schema(
        operation_description="Obtener reporte mensual de solicitudes",
        manual_parameters=[
            openapi.Parameter('year', openapi.IN_QUERY, description="Año para el reporte (opcional)", type=openapi.TYPE_INTEGER),
        ],
        responses={
            200: openapi.Response(
                description="Reporte mensual de solicitudes",
                schema=openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'mes': openapi.Schema(type=openapi.TYPE_STRING),
                            'solicitudes': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'aprobadas': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'rechazadas': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'pendientes': openapi.Schema(type=openapi.TYPE_INTEGER)
                        }
                    )
                )
            )
        },
        tags=['Solicitudes ECE - Reportes']
    )
    @action(detail=False, methods=['get'])
    def monthly_report(self, request):
        """Obtener reporte mensual de solicitudes"""
        from django.db.models import Count, Q
        from django.db.models.functions import TruncMonth
        import datetime
        
        # Parámetros opcionales
        year = request.query_params.get('year', datetime.datetime.now().year)
        
        # Agrupar por mes
        solicitudes_por_mes = ECERequest.objects.filter(
            created_at__year=year
        ).annotate(
            mes=TruncMonth('created_at')
        ).values('mes').annotate(
            total=Count('id'),
            aprobadas=Count('id', filter=Q(status='aprobada')),
            rechazadas=Count('id', filter=Q(status='rechazada')),
            pendientes=Count('id', filter=Q(status__in=['en_proceso', 'pendiente']))
        ).order_by('mes')
        
        # Formatear respuesta
        meses_es = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        data = []
        for item in solicitudes_por_mes:
            mes_num = item['mes'].month
            data.append({
                'mes': meses_es[mes_num - 1],
                'solicitudes': item['total'],
                'aprobadas': item['aprobadas'],
                'rechazadas': item['rechazadas'],
                'pendientes': item['pendientes']
            })
        
        return Response(data)
    
    def get_client_ip(self, request):
        """Obtener IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para logs del sistema (solo lectura para admins)
    """
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user', 'action', 'model_name']
    search_fields = ['description', 'user__username']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    @swagger_auto_schema(
        operation_description="Obtener lista de logs del sistema (solo admins y jefes)",
        manual_parameters=[
            openapi.Parameter('user', openapi.IN_QUERY, description="Filtrar por usuario", type=openapi.TYPE_INTEGER),
            openapi.Parameter('action', openapi.IN_QUERY, description="Filtrar por acción", type=openapi.TYPE_STRING),
            openapi.Parameter('model_name', openapi.IN_QUERY, description="Filtrar por modelo", type=openapi.TYPE_STRING),
            openapi.Parameter('search', openapi.IN_QUERY, description="Búsqueda en descripción o username", type=openapi.TYPE_STRING),
        ],
        tags=['Sistema - Logs']
    )
    def get_queryset(self):
        # Solo admins y jefes pueden ver logs
        if self.request.user.role not in ['admin', 'jefe']:
            return SystemLog.objects.none()
        return SystemLog.objects.select_related('user').all()
    
    @swagger_auto_schema(
        operation_description="Obtener logs recientes (últimos 50)",
        responses={200: SystemLogSerializer(many=True)},
        tags=['Sistema - Logs']
    )
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Obtener logs recientes (últimos 50)"""
        logs = self.get_queryset()[:50]
        serializer = SystemLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Obtener logs por usuario específico",
        manual_parameters=[
            openapi.Parameter('user_id', openapi.IN_QUERY, description="ID del usuario", type=openapi.TYPE_INTEGER, required=True),
        ],
        responses={200: SystemLogSerializer(many=True)},
        tags=['Sistema - Logs']
    )
    @action(detail=False, methods=['get'])
    def by_user(self, request):
        """Obtener logs por usuario"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        logs = self.get_queryset().filter(user_id=user_id)
        serializer = SystemLogSerializer(logs, many=True)
        return Response(serializer.data)


class SystemConfigurationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para configuraciones del sistema (solo admins)
    """
    queryset = SystemConfiguration.objects.all()
    serializer_class = SystemConfigurationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['key', 'description']
    
    def perform_create(self, serializer):
        """Log configuration creation"""
        config = serializer.save()
        try:
            if log_event:
                log_event(user=self.request.user, request=self.request, action='config_change',
                          model_name='SystemConfiguration', object_id=config.id,
                          description=f"Configuración creada: {config.key}={config.value}")
        except Exception:
            pass
    
    def perform_update(self, serializer):
        """Log configuration update"""
        config = serializer.save()
        try:
            if log_event:
                log_event(user=self.request.user, request=self.request, action='config_change',
                          model_name='SystemConfiguration', object_id=config.id,
                          description=f"Configuración actualizada: {config.key}={config.value}")
        except Exception:
            pass
    
    def perform_destroy(self, instance):
        """Log configuration deletion"""
        try:
            if log_event:
                log_event(user=self.request.user, request=self.request, action='config_change',
                          model_name='SystemConfiguration', object_id=instance.id,
                          description=f"Configuración eliminada: {instance.key}")
        except Exception:
            pass
        instance.delete()
    
    @swagger_auto_schema(
        operation_description="Obtener lista de configuraciones del sistema",
        tags=['Sistema - Configuraciones']
    )
    def get_queryset(self):
        # Solo admins pueden gestionar configuraciones
        if self.request.user.role != 'admin':
            return SystemConfiguration.objects.filter(is_active=True)
        return SystemConfiguration.objects.all()
    
    @swagger_auto_schema(
        operation_description="Activar/Desactivar configuración (solo admins)",
        responses={
            200: openapi.Response(
                description="Configuración actualizada",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'config': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            403: "No autorizado"
        },
        tags=['Sistema - Configuraciones']
    )
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activar/Desactivar configuración"""
        if request.user.role != 'admin':
            return Response({'error': 'Solo admins pueden modificar'}, status=status.HTTP_403_FORBIDDEN)
        
        config = self.get_object()
        old_state = config.is_active
        config.is_active = not config.is_active
        config.save()
        
        # Log toggle action
        try:
            if log_event:
                log_event(user=request.user, request=request, action='config_change',
                          model_name='SystemConfiguration', object_id=config.id,
                          description=f"Configuración {config.key} {'activada' if config.is_active else 'desactivada'}")
        except Exception:
            pass
        
        return Response({
            'message': f"Configuración {'activada' if config.is_active else 'desactivada'}",
            'config': SystemConfigurationSerializer(config).data
        }, status=status.HTTP_200_OK)
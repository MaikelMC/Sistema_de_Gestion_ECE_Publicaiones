from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import ECERequest, SystemLog, SystemConfiguration
from .serializers import (
    ECERequestSerializer, ECERequestCreateSerializer, ECERequestReviewSerializer,
    ECERequestDetailSerializer, SystemLogSerializer, SystemLogCreateSerializer,
    SystemConfigurationSerializer
)


class ECERequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de solicitudes ECE
    """
    queryset = ECERequest.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'student', 'reviewed_by']  # Agregar reviewed_by para filtrar por revisor
    search_fields = ['description', 'student__username', 'student__matricula']
    ordering_fields = ['created_at', 'review_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ECERequestCreateSerializer
        elif self.action == 'retrieve':
            return ECERequestDetailSerializer
        return ECERequestSerializer
    
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
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Obtener solicitudes del estudiante actual"""
        if request.user.role != 'estudiante':
            return Response({'error': 'Solo estudiantes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        requests_qs = self.get_queryset().filter(student=request.user)
        serializer = ECERequestSerializer(requests_qs, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """Obtener solicitudes pendientes de revisión (para jefe)"""
        if request.user.role != 'jefe':
            return Response({'error': 'Solo jefes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        requests_qs = ECERequest.objects.filter(status__in=['en_proceso', 'pendiente'])
        serializer = ECERequestSerializer(requests_qs, many=True, context={'request': request})
        return Response(serializer.data)
    
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
        SystemLog.objects.create(
            user=request.user,
            action='review',
            model_name='ECERequest',
            object_id=ece_request.id,
            description=f"Revisión de solicitud ECE: {'Aprobada' if serializer.validated_data['is_approved'] else 'Rechazada'}",
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'message': 'Solicitud revisada exitosamente',
            'request': ECERequestSerializer(ece_request, context={'request': request}).data
        }, status=status.HTTP_200_OK)
    
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
    
    def get_queryset(self):
        # Solo admins y jefes pueden ver logs
        if self.request.user.role not in ['admin', 'jefe']:
            return SystemLog.objects.none()
        return SystemLog.objects.select_related('user').all()
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Obtener logs recientes (últimos 50)"""
        logs = self.get_queryset()[:50]
        serializer = SystemLogSerializer(logs, many=True)
        return Response(serializer.data)
    
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
    
    def get_queryset(self):
        # Solo admins pueden gestionar configuraciones
        if self.request.user.role != 'admin':
            return SystemConfiguration.objects.filter(is_active=True)
        return SystemConfiguration.objects.all()
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activar/Desactivar configuración"""
        if request.user.role != 'admin':
            return Response({'error': 'Solo admins pueden modificar'}, status=status.HTTP_403_FORBIDDEN)
        
        config = self.get_object()
        config.is_active = not config.is_active
        config.save()
        
        return Response({
            'message': f"Configuración {'activada' if config.is_active else 'desactivada'}",
            'config': SystemConfigurationSerializer(config).data
        }, status=status.HTTP_200_OK)

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Publication, TutorOpinion, TutorStudent
from .serializers import (
    PublicationSerializer, PublicationCreateSerializer, PublicationUpdateSerializer,
    PublicationReviewSerializer, PublicationDetailSerializer,
    TutorOpinionSerializer, TutorStudentSerializer
)
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class PublicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de publicaciones
    """
    queryset = Publication.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'nivel', 'student', 'tutor']
    search_fields = ['title', 'authors', 'journal', 'doi']
    ordering_fields = ['created_at', 'publication_date', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PublicationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PublicationUpdateSerializer
        elif self.action == 'retrieve':
            return PublicationDetailSerializer
        return PublicationSerializer
    
    @swagger_auto_schema(
        operation_description="Obtener lista de publicaciones con filtros",
        manual_parameters=[
            openapi.Parameter('status', openapi.IN_QUERY, description="Filtrar por estado", type=openapi.TYPE_STRING),
            openapi.Parameter('nivel', openapi.IN_QUERY, description="Filtrar por nivel", type=openapi.TYPE_INTEGER),
            openapi.Parameter('student', openapi.IN_QUERY, description="Filtrar por estudiante", type=openapi.TYPE_INTEGER),
            openapi.Parameter('tutor', openapi.IN_QUERY, description="Filtrar por tutor", type=openapi.TYPE_INTEGER),
            openapi.Parameter('search', openapi.IN_QUERY, description="Búsqueda en título, autores, journal, DOI", type=openapi.TYPE_STRING),
        ],
        tags=['Publicaciones']
    )
    def get_queryset(self):
        user = self.request.user
        queryset = Publication.objects.select_related('student', 'tutor', 'reviewed_by').all()
        
        # Filtrar según rol
        if user.role == 'estudiante':
            queryset = queryset.filter(student=user)
        elif user.role == 'tutor':
            # Tutores ven publicaciones de sus estudiantes asignados
            student_ids = TutorStudent.objects.filter(tutor=user, is_active=True).values_list('student_id', flat=True)
            queryset = queryset.filter(student_id__in=student_ids)
        
        return queryset
    
    @swagger_auto_schema(
        operation_description="Obtener publicaciones del estudiante actual",
        responses={200: PublicationSerializer(many=True)},
        tags=['Publicaciones - Estudiantes']
    )
    @action(detail=False, methods=['get'])
    def my_publications(self, request):
        """Obtener publicaciones del estudiante actual"""
        if request.user.role != 'estudiante':
            return Response({'error': 'Solo estudiantes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        publications = self.get_queryset().filter(student=request.user)
        serializer = PublicationSerializer(publications, many=True, context={'request': request})
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Obtener publicaciones pendientes de revisión (para jefe)",
        responses={200: PublicationSerializer(many=True)},
        tags=['Publicaciones - Jefes']
    )
    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """Obtener publicaciones pendientes de revisión (para jefe)"""
        if request.user.role != 'jefe':
            return Response({'error': 'Solo jefes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        publications = Publication.objects.filter(status='pending')
        serializer = PublicationSerializer(publications, many=True, context={'request': request})
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Revisar una publicación (para jefe de departamento)",
        request_body=PublicationReviewSerializer,
        responses={
            200: openapi.Response(
                description="Publicación revisada exitosamente",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'publication': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            403: "No autorizado",
            400: "Datos inválidos"
        },
        tags=['Publicaciones - Jefes']
    )
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Revisar una publicación (para jefe de departamento)"""
        if request.user.role != 'jefe':
            return Response({'error': 'Solo jefes pueden revisar'}, status=status.HTTP_403_FORBIDDEN)
        
        publication = self.get_object()
        serializer = PublicationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(publication=publication, reviewer=request.user)
        
        return Response({
            'message': 'Publicación revisada exitosamente',
            'publication': PublicationSerializer(publication, context={'request': request}).data
        }, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        operation_description="Enviar publicación para revisión",
        responses={
            200: openapi.Response(
                description="Publicación enviada para revisión",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'publication': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            403: "No autorizado",
            400: "La publicación no está en proceso"
        },
        tags=['Publicaciones - Estudiantes']
    )
    @action(detail=True, methods=['post'])
    def submit_for_review(self, request, pk=None):
        """Enviar publicación para revisión"""
        publication = self.get_object()
        
        if publication.student != request.user:
            return Response({'error': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        
        if publication.status != 'en_proceso':
            return Response({'error': 'La publicación no está en proceso'}, status=status.HTTP_400_BAD_REQUEST)
        
        publication.status = 'pending'
        publication.save()
        
        return Response({
            'message': 'Publicación enviada para revisión',
            'publication': PublicationSerializer(publication, context={'request': request}).data
        }, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        operation_description="Obtener estadísticas de publicaciones",
        responses={
            200: openapi.Response(
                description="Estadísticas de publicaciones",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'total': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'pendientes': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'aprobadas': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'rechazadas': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'en_proceso': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'por_nivel': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'tasa_aprobacion': openapi.Schema(type=openapi.TYPE_NUMBER)
                    }
                )
            )
        },
        tags=['Publicaciones - Estadísticas']
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de publicaciones"""
        from django.db.models import Count
        
        # Estadísticas generales
        total = Publication.objects.count()
        pendientes = Publication.objects.filter(status='pending').count()
        aprobadas = Publication.objects.filter(status='approved').count()
        rechazadas = Publication.objects.filter(status='rejected').count()
        en_proceso = Publication.objects.filter(status='en_proceso').count()
        
        # Por nivel
        por_nivel = Publication.objects.values('nivel').annotate(
            count=Count('id')
        ).order_by('nivel')
        
        return Response({
            'total': total,
            'pendientes': pendientes,
            'aprobadas': aprobadas,
            'rechazadas': rechazadas,
            'en_proceso': en_proceso,
            'por_nivel': {item['nivel']: item['count'] for item in por_nivel},
            'tasa_aprobacion': round((aprobadas / total * 100) if total > 0 else 0, 2)
        })
    
    @swagger_auto_schema(
        operation_description="Obtener publicaciones agrupadas por nivel con detalles",
        responses={
            200: openapi.Response(
                description="Publicaciones por nivel",
                schema=openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'nivel': openapi.Schema(type=openapi.TYPE_STRING),
                            'cantidad': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'color': openapi.Schema(type=openapi.TYPE_STRING)
                        }
                    )
                )
            )
        },
        tags=['Publicaciones - Estadísticas']
    )
    @action(detail=False, methods=['get'])
    def by_level(self, request):
        """Obtener publicaciones agrupadas por nivel con detalles"""
        from django.db.models import Count
        
        por_nivel = Publication.objects.filter(
            status='approved'
        ).values('nivel').annotate(
            cantidad=Count('id')
        ).order_by('nivel')
        
        # Formatear con colores
        colores = {
            1: '#ef4444',  # Rojo
            2: '#f59e0b',  # Naranja
            3: '#10b981',  # Verde
            4: '#3b82f6',  # Azul
        }
        
        data = []
        for item in por_nivel:
            nivel = item['nivel']
            data.append({
                'nivel': f'Nivel {nivel}',
                'cantidad': item['cantidad'],
                'color': colores.get(nivel, '#6b7280')
            })
        
        return Response(data)


class TutorOpinionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para opiniones de tutores
    """
    queryset = TutorOpinion.objects.all()
    serializer_class = TutorOpinionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['publication', 'tutor', 'recommendation']
    ordering = ['-created_at']
    
    @swagger_auto_schema(
        operation_description="Obtener lista de opiniones con filtros",
        manual_parameters=[
            openapi.Parameter('publication', openapi.IN_QUERY, description="Filtrar por publicación", type=openapi.TYPE_INTEGER),
            openapi.Parameter('tutor', openapi.IN_QUERY, description="Filtrar por tutor", type=openapi.TYPE_INTEGER),
            openapi.Parameter('recommendation', openapi.IN_QUERY, description="Filtrar por recomendación", type=openapi.TYPE_STRING),
        ],
        tags=['Publicaciones - Opiniones de Tutores']
    )
    def get_queryset(self):
        user = self.request.user
        queryset = TutorOpinion.objects.select_related('publication', 'tutor').all()
        
        if user.role == 'tutor':
            queryset = queryset.filter(tutor=user)
        elif user.role == 'estudiante':
            queryset = queryset.filter(publication__student=user)
        
        return queryset
    
    @swagger_auto_schema(
        operation_description="Obtener opiniones emitidas por el tutor actual",
        responses={200: TutorOpinionSerializer(many=True)},
        tags=['Publicaciones - Opiniones de Tutores']
    )
    @action(detail=False, methods=['get'])
    def my_opinions(self, request):
        """Obtener opiniones emitidas por el tutor actual"""
        if request.user.role != 'tutor':
            return Response({'error': 'Solo tutores pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        opinions = self.get_queryset().filter(tutor=request.user)
        serializer = TutorOpinionSerializer(opinions, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Obtener publicaciones pendientes de opinión del tutor",
        responses={200: PublicationSerializer(many=True)},
        tags=['Publicaciones - Opiniones de Tutores']
    )
    @action(detail=False, methods=['get'])
    def pending_publications(self, request):
        """Obtener publicaciones pendientes de opinión del tutor"""
        if request.user.role != 'tutor':
            return Response({'error': 'Solo tutores pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener estudiantes asignados al tutor
        student_ids = TutorStudent.objects.filter(
            tutor=request.user, 
            is_active=True
        ).values_list('student_id', flat=True)
        
        # Publicaciones pendientes de esos estudiantes sin opinión del tutor
        publications = Publication.objects.filter(
            student_id__in=student_ids,
            status='pending'
        ).exclude(
            tutor_opinions__tutor=request.user
        )
        
        serializer = PublicationSerializer(publications, many=True, context={'request': request})
        return Response(serializer.data)


class TutorStudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para relación Tutor-Estudiante
    """
    queryset = TutorStudent.objects.all()
    serializer_class = TutorStudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['tutor', 'student', 'is_active']
    ordering = ['-assigned_date']
    
    @swagger_auto_schema(
        operation_description="Obtener lista de relaciones tutor-estudiante con filtros",
        manual_parameters=[
            openapi.Parameter('tutor', openapi.IN_QUERY, description="Filtrar por tutor", type=openapi.TYPE_INTEGER),
            openapi.Parameter('student', openapi.IN_QUERY, description="Filtrar por estudiante", type=openapi.TYPE_INTEGER),
            openapi.Parameter('is_active', openapi.IN_QUERY, description="Filtrar por estado activo", type=openapi.TYPE_BOOLEAN),
        ],
        tags=['Publicaciones - Relaciones Tutor-Estudiante']
    )
    def get_queryset(self):
        user = self.request.user
        queryset = TutorStudent.objects.select_related('tutor', 'student').all()
        
        if user.role == 'tutor':
            queryset = queryset.filter(tutor=user)
        elif user.role == 'estudiante':
            queryset = queryset.filter(student=user)
        
        return queryset
    
    @swagger_auto_schema(
        operation_description="Obtener estudiantes asignados al tutor actual",
        responses={200: TutorStudentSerializer(many=True)},
        tags=['Publicaciones - Relaciones Tutor-Estudiante']
    )
    @action(detail=False, methods=['get'])
    def my_students(self, request):
        """Obtener estudiantes asignados al tutor actual"""
        if request.user.role != 'tutor':
            return Response({'error': 'Solo tutores pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        relations = self.get_queryset().filter(tutor=request.user, is_active=True)
        serializer = TutorStudentSerializer(relations, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Obtener tutores asignados al estudiante actual",
        responses={200: TutorStudentSerializer(many=True)},
        tags=['Publicaciones - Relaciones Tutor-Estudiante']
    )
    @action(detail=False, methods=['get'])
    def my_tutors(self, request):
        """Obtener tutores asignados al estudiante actual"""
        if request.user.role != 'estudiante':
            return Response({'error': 'Solo estudiantes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        relations = self.get_queryset().filter(student=request.user, is_active=True)
        serializer = TutorStudentSerializer(relations, many=True)
        return Response(serializer.data)
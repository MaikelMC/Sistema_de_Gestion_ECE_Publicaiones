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


class PublicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de publicaciones
    """
    queryset = Publication.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Agregado JSONParser
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
    
    @action(detail=False, methods=['get'])
    def my_publications(self, request):
        """Obtener publicaciones del estudiante actual"""
        if request.user.role != 'estudiante':
            return Response({'error': 'Solo estudiantes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        publications = self.get_queryset().filter(student=request.user)
        serializer = PublicationSerializer(publications, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """Obtener publicaciones pendientes de revisión (para jefe)"""
        if request.user.role != 'jefe':
            return Response({'error': 'Solo jefes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        publications = Publication.objects.filter(status='pending')
        serializer = PublicationSerializer(publications, many=True, context={'request': request})
        return Response(serializer.data)
    
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
    
    def get_queryset(self):
        user = self.request.user
        queryset = TutorOpinion.objects.select_related('publication', 'tutor').all()
        
        if user.role == 'tutor':
            queryset = queryset.filter(tutor=user)
        elif user.role == 'estudiante':
            queryset = queryset.filter(publication__student=user)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_opinions(self, request):
        """Obtener opiniones emitidas por el tutor actual"""
        if request.user.role != 'tutor':
            return Response({'error': 'Solo tutores pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        opinions = self.get_queryset().filter(tutor=request.user)
        serializer = TutorOpinionSerializer(opinions, many=True)
        return Response(serializer.data)
    
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
    
    def get_queryset(self):
        user = self.request.user
        queryset = TutorStudent.objects.select_related('tutor', 'student').all()
        
        if user.role == 'tutor':
            queryset = queryset.filter(tutor=user)
        elif user.role == 'estudiante':
            queryset = queryset.filter(student=user)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_students(self, request):
        """Obtener estudiantes asignados al tutor actual"""
        if request.user.role != 'tutor':
            return Response({'error': 'Solo tutores pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        relations = self.get_queryset().filter(tutor=request.user, is_active=True)
        serializer = TutorStudentSerializer(relations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_tutors(self, request):
        """Obtener tutores asignados al estudiante actual"""
        if request.user.role != 'estudiante':
            return Response({'error': 'Solo estudiantes pueden acceder'}, status=status.HTTP_403_FORBIDDEN)
        
        relations = self.get_queryset().filter(student=request.user, is_active=True)
        serializer = TutorStudentSerializer(relations, many=True)
        return Response(serializer.data)
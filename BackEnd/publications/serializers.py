from rest_framework import serializers
from .models import Publication, TutorOpinion, TutorStudent
from authentication.serializers import UserListSerializer


class PublicationSerializer(serializers.ModelSerializer):
    """
    Serializer principal para publicaciones
    """
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    tutor_name = serializers.CharField(source='tutor.get_full_name', read_only=True, allow_null=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    # Aliases en español para compatibilidad con frontend
    titulo = serializers.CharField(source='title', read_only=True)
    autores = serializers.CharField(source='authors', read_only=True)
    fecha_publicacion = serializers.DateField(source='publication_date', read_only=True)
    revista = serializers.CharField(source='journal', read_only=True)
    volumen = serializers.CharField(source='volume', read_only=True)
    paginas = serializers.CharField(source='pages', read_only=True)
    resumen = serializers.CharField(source='abstract', read_only=True)
    archivo = serializers.FileField(source='file', read_only=True)
    
    class Meta:
        model = Publication
        fields = [
            'id', 'student', 'student_name', 'student_matricula', 'tutor', 'tutor_name',
            'title', 'authors', 'publication_date', 'journal', 'volume', 'pages',
            'doi', 'abstract', 'file', 'file_url', 'nivel', 'nivel_display',
            'status', 'status_display', 'reviewed_by', 'reviewed_by_name',
            'review_comments', 'review_date', 'created_at', 'updated_at',
            # Campos en español
            'titulo', 'autores', 'fecha_publicacion', 'revista', 'volumen',
            'paginas', 'resumen', 'archivo'
        ]
        read_only_fields = ['id', 'student', 'reviewed_by', 'review_date', 'created_at', 'updated_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class PublicationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear publicaciones
    """
    # Campos con nombres alternativos para compatibilidad con frontend
    titulo = serializers.CharField(source='title', required=False, max_length=500)
    autores = serializers.CharField(source='authors', required=False)
    fecha_publicacion = serializers.DateField(source='publication_date', required=False, allow_null=True)
    revista = serializers.CharField(source='journal', required=False, allow_blank=True, default='')
    volumen = serializers.CharField(source='volume', required=False, allow_blank=True, default='')
    paginas = serializers.CharField(source='pages', required=False, allow_blank=True, default='')
    resumen = serializers.CharField(source='abstract', required=False, allow_blank=True, default='')
    archivo = serializers.FileField(source='file', required=False, allow_null=True)
    
    class Meta:
        model = Publication
        fields = [
            'titulo', 'autores', 'fecha_publicacion', 'revista', 'volumen',
            'paginas', 'doi', 'resumen', 'archivo', 'nivel',
            # Campos originales para compatibilidad
            'title', 'authors', 'publication_date', 'journal', 'volume',
            'pages', 'abstract', 'file'
        ]
        extra_kwargs = {
            'title': {'write_only': True, 'required': False},
            'authors': {'write_only': True, 'required': False},
            'publication_date': {'write_only': True, 'required': False},
            'journal': {'write_only': True, 'required': False, 'allow_blank': True},
            'volume': {'write_only': True, 'required': False, 'allow_blank': True},
            'pages': {'write_only': True, 'required': False, 'allow_blank': True},
            'abstract': {'write_only': True, 'required': False},
            'file': {'write_only': True, 'required': False},
            'doi': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, attrs):
        # Asegurar que tenemos nivel
        if 'nivel' not in attrs or not attrs['nivel']:
            raise serializers.ValidationError({"nivel": "El nivel es requerido."})
        
        # Validar que nivel sea válido
        if str(attrs['nivel']) not in ['1', '2', '3']:
            raise serializers.ValidationError({"nivel": "Nivel debe ser 1, 2 o 3."})
        
        # Asegurar que nivel es string
        attrs['nivel'] = str(attrs['nivel'])
        
        # Si no hay journal, poner un valor por defecto
        if 'journal' not in attrs or not attrs.get('journal'):
            attrs['journal'] = ''
        
        return attrs
    
    def create(self, validated_data):
        # Asignar el estudiante actual
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['student'] = request.user
        
        # Asegurar valores por defecto
        if 'journal' not in validated_data:
            validated_data['journal'] = ''
        
        return super().create(validated_data)
    
    def validate_archivo(self, value):
        if value:
            # Validar tamaño del archivo (max 50MB)
            if value.size > 50 * 1024 * 1024:
                raise serializers.ValidationError("El archivo no puede superar los 50MB.")
            
            # Validar extensión (permitir PDF, DOC, DOCX)
            allowed_extensions = ['.pdf', '.doc', '.docx']
            file_ext = value.name.lower()
            if not any(file_ext.endswith(ext) for ext in allowed_extensions):
                raise serializers.ValidationError("Solo se permiten archivos PDF, DOC o DOCX.")
        return value
    
    def validate_file(self, value):
        """Validar campo 'file' (mismo que 'archivo')"""
        return self.validate_archivo(value)


class PublicationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar publicaciones
    """
    class Meta:
        model = Publication
        fields = [
            'title', 'authors', 'publication_date', 'journal', 'volume',
            'pages', 'doi', 'abstract', 'file', 'nivel', 'status'
        ]
    
    def validate_status(self, value):
        # Solo el estudiante puede cambiar a 'pending' para enviar a revisión
        if value == 'pending' and self.instance.status == 'en_proceso':
            return value
        # Otros cambios de estado no están permitidos aquí
        if value != self.instance.status:
            raise serializers.ValidationError(
                "No puedes cambiar el estado de esta forma. Usa el endpoint de revisión."
            )
        return value


class PublicationReviewSerializer(serializers.Serializer):
    """
    Serializer para revisar publicaciones (Jefe de Departamento)
    """
    is_approved = serializers.BooleanField(required=True)
    comments = serializers.CharField(required=False, allow_blank=True)
    
    def save(self, publication, reviewer):
        publication.status = 'approved' if self.validated_data['is_approved'] else 'rejected'
        publication.review_comments = self.validated_data.get('comments', '')
        publication.reviewed_by = reviewer
        from django.utils import timezone
        publication.review_date = timezone.now()
        publication.save()
        return publication


class TutorOpinionSerializer(serializers.ModelSerializer):
    """
    Serializer para opiniones de tutores
    """
    tutor_name = serializers.CharField(source='tutor.get_full_name', read_only=True)
    publication_title = serializers.CharField(source='publication.title', read_only=True)
    recommendation_display = serializers.CharField(source='get_recommendation_display', read_only=True)
    
    class Meta:
        model = TutorOpinion
        fields = [
            'id', 'publication', 'publication_title', 'tutor', 'tutor_name',
            'opinion', 'recommendation', 'recommendation_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tutor', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['tutor'] = self.context['request'].user
        return super().create(validated_data)


class TutorStudentSerializer(serializers.ModelSerializer):
    """
    Serializer para relación Tutor-Estudiante
    """
    tutor_name = serializers.CharField(source='tutor.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    student_carrera = serializers.CharField(source='student.carrera', read_only=True)
    pending_publications = serializers.SerializerMethodField()
    
    class Meta:
        model = TutorStudent
        fields = [
            'id', 'tutor', 'tutor_name', 'student', 'student_name',
            'student_matricula', 'student_carrera', 'assigned_date',
            'is_active', 'progress', 'pending_publications', 'created_at'
        ]
        read_only_fields = ['id', 'assigned_date', 'created_at']
    
    def get_pending_publications(self, obj):
        return obj.student.publications.filter(status='pending').count()


class PublicationDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detallado para una publicación con opiniones
    """
    student = UserListSerializer(read_only=True)
    tutor = UserListSerializer(read_only=True)
    reviewed_by = UserListSerializer(read_only=True)
    tutor_opinions = TutorOpinionSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Publication
        fields = [
            'id', 'student', 'tutor', 'title', 'authors', 'publication_date',
            'journal', 'volume', 'pages', 'doi', 'abstract', 'file', 'file_url',
            'nivel', 'nivel_display', 'status', 'status_display', 'reviewed_by',
            'review_comments', 'review_date', 'tutor_opinions', 'created_at', 'updated_at'
        ]
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

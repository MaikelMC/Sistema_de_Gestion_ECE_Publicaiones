from rest_framework import serializers
from .models import ECERequest, SystemLog, SystemConfiguration, AdminNotification
from authentication.serializers import UserListSerializer


class ECERequestSerializer(serializers.ModelSerializer):
    """
    Serializer principal para solicitudes ECE
    """
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ECERequest
        fields = [
            'id', 'student', 'student_name', 'student_matricula', 'file',
            'file_url', 'description', 'status', 'status_display',
            'reviewed_by', 'reviewed_by_name', 'review_comments',
            'review_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student', 'reviewed_by', 'review_date', 'created_at', 'updated_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ECERequestCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear solicitudes ECE
    """
    class Meta:
        model = ECERequest
        fields = ['file', 'description']
    
    def validate_file(self, value):
        if value:
            # Validar tamaño del archivo (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("El archivo no puede superar los 10MB.")
            
            # Validar extensión
            allowed_extensions = ['.pdf', '.doc', '.docx']
            file_ext = value.name.lower()[value.name.rfind('.'):]
            if file_ext not in allowed_extensions:
                raise serializers.ValidationError(
                    "Solo se permiten archivos PDF, DOC o DOCX."
                )
        return value
    
    def create(self, validated_data):
        # El estudiante se asigna automáticamente desde el request
        validated_data['student'] = self.context['request'].user
        validated_data['status'] = 'en_proceso'
        return super().create(validated_data)


class ECERequestReviewSerializer(serializers.Serializer):
    """
    Serializer para revisar solicitudes ECE (Jefe de Departamento)
    """
    is_approved = serializers.BooleanField(required=True)
    comments = serializers.CharField(required=False, allow_blank=True)
    
    def save(self, ece_request, reviewer):
        ece_request.status = 'aprobada' if self.validated_data['is_approved'] else 'rechazada'
        ece_request.review_comments = self.validated_data.get('comments', '')
        ece_request.reviewed_by = reviewer
        from django.utils import timezone
        ece_request.review_date = timezone.now()
        ece_request.save()
        return ece_request


class ECERequestDetailSerializer(serializers.ModelSerializer):
    """
    Serializer detallado para solicitudes ECE
    """
    student = UserListSerializer(read_only=True)
    reviewed_by = UserListSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ECERequest
        fields = [
            'id', 'student', 'file', 'file_url', 'description',
            'status', 'status_display', 'reviewed_by', 'review_comments',
            'review_date', 'created_at', 'updated_at'
        ]
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class SystemLogSerializer(serializers.ModelSerializer):
    """
    Serializer para logs del sistema
    """
    user_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = [
            'id', 'user', 'user_name', 'action', 'action_display',
            'model_name', 'object_id', 'description', 'ip_address',
            'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_user_name(self, obj):
        """Obtener nombre del usuario con fallback"""
        if obj.user:
            full_name = obj.user.get_full_name()
            if full_name and full_name.strip():
                return full_name
            return obj.user.username
        return 'Sistema'


class SystemLogCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear logs del sistema
    """
    class Meta:
        model = SystemLog
        fields = [
            'user', 'action', 'model_name', 'object_id', 'description',
            'ip_address', 'user_agent'
        ]


class SystemConfigurationSerializer(serializers.ModelSerializer):
    """
    Serializer para configuraciones del sistema
    """
    class Meta:
        model = SystemConfiguration
        fields = [
            'id', 'key', 'value', 'description', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_key(self, value):
        # Validar que la clave no exista (excepto al actualizar)
        if self.instance is None:
            if SystemConfiguration.objects.filter(key=value).exists():
                raise serializers.ValidationError("Esta clave ya existe en la configuración.")
        else:
            if SystemConfiguration.objects.filter(key=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Esta clave ya existe en la configuración.")
        return value


class AdminNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer para notificaciones del administrador
    """
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminNotification
        fields = [
            'id', 'notification_type', 'type_display', 'severity', 'severity_display',
            'title', 'message', 'user', 'user_name', 'ip_address', 'metadata',
            'is_read', 'is_resolved', 'created_at', 'read_at', 'resolved_at'
        ]
        read_only_fields = [
            'id', 'notification_type', 'severity', 'title', 'message', 'user',
            'ip_address', 'metadata', 'created_at'
        ]
    
    def get_user_name(self, obj):
        """Retorna el nombre del usuario asociado a la notificación"""
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return None

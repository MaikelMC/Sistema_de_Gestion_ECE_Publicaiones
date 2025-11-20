from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator

class ECERequest(models.Model):
    """
    Modelo para solicitudes de modalidad ECE (Estancia de Colaboración Empresarial)
    """
    STATUS_CHOICES = (
        ('en_proceso', 'En Proceso'),
        ('pendiente', 'Pendiente de Revisión'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
    )
    
    # Relaciones
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ece_requests',
        limit_choices_to={'role': 'estudiante'}
    )
    
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ece_requests_reviewed',
        limit_choices_to={'role': 'jefe'}
    )
    
    # Información de la solicitud
    file = models.FileField(
        'Archivo de Solicitud',
        upload_to='ece_requests/%Y/%m/',
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx'])],
        help_text='Documento con la solicitud de modalidad ECE'
    )
    
    description = models.TextField('Descripción', null=True, blank=True)
    
    # Estado y revisión
    status = models.CharField(
        'Estado',
        max_length=20,
        choices=STATUS_CHOICES,
        default='en_proceso'
    )
    
    review_comments = models.TextField('Comentarios de Revisión', null=True, blank=True)
    review_date = models.DateTimeField('Fecha de Revisión', null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField('Fecha de Solicitud', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    
    class Meta:
        db_table = 'ece_requests'
        verbose_name = 'Solicitud ECE'
        verbose_name_plural = 'Solicitudes ECE'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Solicitud ECE - {self.student.get_full_name()} ({self.status})"


class SystemLog(models.Model):
    """
    Modelo para registrar logs del sistema (para administradores)
    """
    ACTION_CHOICES = (
        ('create', 'Crear'),
        ('update', 'Actualizar'),
        ('delete', 'Eliminar'),
        ('login', 'Inicio de Sesión'),
        ('logout', 'Cierre de Sesión'),
        ('review', 'Revisión'),
        ('approve', 'Aprobación'),
        ('reject', 'Rechazo'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_logs'
    )
    
    action = models.CharField('Acción', max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField('Modelo', max_length=100)
    object_id = models.IntegerField('ID del Objeto', null=True, blank=True)
    description = models.TextField('Descripción')
    ip_address = models.GenericIPAddressField('Dirección IP', null=True, blank=True)
    user_agent = models.TextField('User Agent', null=True, blank=True)
    
    created_at = models.DateTimeField('Fecha', auto_now_add=True)
    
    class Meta:
        db_table = 'system_logs'
        verbose_name = 'Log del Sistema'
        verbose_name_plural = 'Logs del Sistema'
        ordering = ['-created_at']
    
    def __str__(self):
        user_str = self.user.username if self.user else 'Sistema'
        return f"{user_str} - {self.get_action_display()} - {self.created_at}"


class SystemConfiguration(models.Model):
    """
    Modelo para configuraciones del sistema
    """
    key = models.CharField('Clave', max_length=100, unique=True)
    value = models.TextField('Valor')
    description = models.TextField('Descripción', null=True, blank=True)
    is_active = models.BooleanField('Activo', default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_configurations'
        verbose_name = 'Configuración del Sistema'
        verbose_name_plural = 'Configuraciones del Sistema'
    
    def __str__(self):
        return f"{self.key}: {self.value[:50]}"

from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.utils import timezone

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
        ('login_success', 'Login Exitoso'),
        ('login_failed', 'Login Fallido'),
        ('logout', 'Cierre de Sesión'),
        ('review', 'Revisión'),
        ('approve', 'Aprobación'),
        ('reject', 'Rechazo'),
        ('user_lock', 'Bloqueo de Usuario'),
        ('ip_block', 'Bloqueo de IP'),
        ('ip_blocked_attempt', 'Intento desde IP Bloqueada'),
        ('admin_unlock', 'Desbloqueo por Admin'),
        ('admin_ip_deny', 'Acceso Admin Denegado por IP'),
        ('user_create', 'Creación de Usuario'),
        ('user_update', 'Actualización de Usuario'),
        ('user_delete', 'Eliminación de Usuario'),
        ('permission_change', 'Cambio de Permisos'),
        ('config_change', 'Cambio de Configuración'),
        ('unauthorized_attempt', 'Intento de Acceso No Autorizado'),
        ('system_error', 'Error del Sistema'),
        ('db_error', 'Error de Base de Datos'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_logs'
    )
    
    action = models.CharField('Acción', max_length=50, choices=ACTION_CHOICES)
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


class AdminNotification(models.Model):
    """
    Modelo para notificaciones al panel de administración
    """
    SEVERITY_CHOICES = (
        ('info', 'Información'),
        ('warning', 'Advertencia'),
        ('error', 'Error'),
        ('critical', 'Crítico'),
    )
    
    TYPE_CHOICES = (
        ('failed_login', 'Intento Fallido de Login'),
        ('simultaneous_access', 'Acceso Simultáneo'),
        ('system_error', 'Error del Sistema'),
        ('db_error', 'Error de Base de Datos'),
        ('unauthorized_attempt', 'Operación No Autorizada'),
        ('post_approval_modification', 'Modificación Post-Aprobación'),
        ('user_locked', 'Usuario Bloqueado'),
        ('ip_blocked', 'IP Bloqueada'),
    )
    
    notification_type = models.CharField('Tipo', max_length=50, choices=TYPE_CHOICES)
    severity = models.CharField('Severidad', max_length=20, choices=SEVERITY_CHOICES, default='info')
    title = models.CharField('Título', max_length=200)
    message = models.TextField('Mensaje')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    ip_address = models.GenericIPAddressField('IP', null=True, blank=True)
    metadata = models.JSONField('Metadatos', default=dict, blank=True)
    is_read = models.BooleanField('Leída', default=False)
    is_resolved = models.BooleanField('Resuelta', default=False)
    read_at = models.DateTimeField('Leída en', null=True, blank=True)
    resolved_at = models.DateTimeField('Resuelta en', null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_notifications')
    created_at = models.DateTimeField('Creada', auto_now_add=True)
    
    class Meta:
        db_table = 'admin_notifications'
        verbose_name = 'Notificación de Admin'
        verbose_name_plural = 'Notificaciones de Admin'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_severity_display()} - {self.title}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def resolve(self, resolved_by=None):
        if not self.is_resolved:
            self.is_resolved = True
            self.resolved_at = timezone.now()
            self.resolved_by = resolved_by
            self.save(update_fields=['is_resolved', 'resolved_at', 'resolved_by'])


class ActiveSession(models.Model):
    """Modelo para detectar accesos simultáneos"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='active_sessions')
    session_key = models.CharField('Session Key', max_length=40, unique=True)
    ip_address = models.GenericIPAddressField('IP')
    user_agent = models.TextField('User Agent', null=True, blank=True)
    last_activity = models.DateTimeField('Última Actividad', auto_now=True)
    created_at = models.DateTimeField('Creada', auto_now_add=True)
    
    class Meta:
        db_table = 'active_sessions'
        verbose_name = 'Sesión Activa'
        verbose_name_plural = 'Sesiones Activas'
        ordering = ['-last_activity']
    
    def __str__(self):
        return f"{self.user.username} - {self.ip_address}"

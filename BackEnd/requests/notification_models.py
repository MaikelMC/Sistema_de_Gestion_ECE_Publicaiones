"""
Modelos para el sistema de notificaciones y alarmas
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


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
    
    # Información de la notificación
    notification_type = models.CharField('Tipo', max_length=50, choices=TYPE_CHOICES)
    severity = models.CharField('Severidad', max_length=20, choices=SEVERITY_CHOICES, default='info')
    title = models.CharField('Título', max_length=200)
    message = models.TextField('Mensaje')
    
    # Contexto adicional
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='Usuario Relacionado'
    )
    ip_address = models.GenericIPAddressField('IP', null=True, blank=True)
    metadata = models.JSONField('Metadatos', default=dict, blank=True)
    
    # Estado
    is_read = models.BooleanField('Leída', default=False)
    is_resolved = models.BooleanField('Resuelta', default=False)
    read_at = models.DateTimeField('Leída en', null=True, blank=True)
    resolved_at = models.DateTimeField('Resuelta en', null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_notifications',
        verbose_name='Resuelta por'
    )
    
    created_at = models.DateTimeField('Creada', auto_now_add=True)
    
    class Meta:
        db_table = 'admin_notifications'
        verbose_name = 'Notificación de Admin'
        verbose_name_plural = 'Notificaciones de Admin'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['is_read', 'severity']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"{self.get_severity_display()} - {self.title}"
    
    def mark_as_read(self):
        """Marcar notificación como leída"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def resolve(self, resolved_by=None):
        """Marcar notificación como resuelta"""
        if not self.is_resolved:
            self.is_resolved = True
            self.resolved_at = timezone.now()
            self.resolved_by = resolved_by
            self.save(update_fields=['is_resolved', 'resolved_at', 'resolved_by'])


class NotificationConfig(models.Model):
    """
    Configuración de notificaciones por rol
    """
    CHANNEL_CHOICES = (
        ('panel', 'Panel de Admin'),
        ('email', 'Email'),
        ('both', 'Ambos'),
    )
    
    role = models.CharField('Rol', max_length=20, choices=settings.AUTH_USER_MODEL.ROLE_CHOICES if hasattr(settings, 'AUTH_USER_MODEL') else [])
    notification_type = models.CharField('Tipo de Notificación', max_length=50, choices=AdminNotification.TYPE_CHOICES)
    enabled = models.BooleanField('Habilitada', default=True)
    channel = models.CharField('Canal', max_length=20, choices=CHANNEL_CHOICES, default='panel')
    min_severity = models.CharField('Severidad Mínima', max_length=20, choices=AdminNotification.SEVERITY_CHOICES, default='info')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_configs'
        verbose_name = 'Configuración de Notificación'
        verbose_name_plural = 'Configuraciones de Notificaciones'
        unique_together = [['role', 'notification_type']]
    
    def __str__(self):
        return f"{self.role} - {self.get_notification_type_display()}"


class ActiveSession(models.Model):
    """
    Modelo para detectar accesos simultáneos
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='active_sessions'
    )
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
        indexes = [
            models.Index(fields=['user', '-last_activity']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.ip_address}"

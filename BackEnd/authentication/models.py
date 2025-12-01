from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.hashers import check_password
from django.utils import timezone

class User(AbstractUser):
    """
    Modelo extendido de usuario con roles y campos adicionales
    """
    ROLE_CHOICES = (
        ('estudiante', 'Estudiante'),
        ('tutor', 'Tutor'),
        ('jefe', 'Jefe de Departamento'),
        ('admin', 'Administrador'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='estudiante')
    # `anno` no debe ser único a nivel de base de datos porque varios usuarios
    # pueden compartir el mismo año académico. La validación de rango se
    # maneja en el serializer (`validate_anno`). Hacemos el campo opcional
    # para permitir el registro sin especificar el año; el estudiante podrá
    # actualizarlo después desde su perfil.
    anno = models.IntegerField(null=True, blank=True)
    carrera = models.CharField(max_length=200, null=True, blank=True)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    fecha_ingreso = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    
    # Para tutores
    especialidad = models.CharField(max_length=200, null=True, blank=True)
    grado_academico = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Bloqueo por intentos fallidos
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"
    
    @property
    def is_estudiante(self):
        return self.role == 'estudiante'
    
    @property
    def is_tutor(self):
        return self.role == 'tutor'
    
    @property
    def is_jefe(self):
        return self.role == 'jefe'

    def is_password_reused(self, raw_password, history_count=5):
        """
        Comprueba si `raw_password` coincide con la contraseña actual
        o con alguna de las últimas `history_count` contraseñas.
        Usa `check_password` contra las contraseñas codificadas almacenadas.
        """
        # Comprobar contra la contraseña actual
        if check_password(raw_password, self.password):
            return True

        # Consultar historial
        recent = PasswordHistory.objects.filter(user=self).order_by('-created_at')[:history_count]
        for ph in recent:
            if check_password(raw_password, ph.password):
                return True
        return False


class PasswordHistory(models.Model):
    """Historial de contraseñas previas (almacena hash tal cual).

    Almacenar hashes permite comparar con `check_password` sin acceder
    a contraseñas en claro.
    """
    user = models.ForeignKey('authentication.User', related_name='password_history', on_delete=models.CASCADE)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'password_history'
        ordering = ['-created_at']

    def __str__(self):
        return f"PasswordHistory(user_id={self.user_id}, created_at={self.created_at})"


class FailedLoginIP(models.Model):
    """Registro de intentos fallidos por dirección IP.

    Esto permite bloquear temporalmente una IP que realiza intentos
    fallidos excesivos contra múltiples cuentas.
    """
    ip_address = models.CharField(max_length=45, unique=True)
    attempts = models.IntegerField(default=0)
    last_attempt = models.DateTimeField(null=True, blank=True)
    blocked_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'failed_login_ips'

    def __str__(self):
        return f"FailedLoginIP(ip={self.ip_address}, attempts={self.attempts}, blocked_until={self.blocked_until})"
from django.contrib.auth.models import AbstractUser
from django.db import models

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
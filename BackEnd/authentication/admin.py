from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin personalizado para el modelo User
    """
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'matricula', 'activo')
    list_filter = ('role', 'activo', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'matricula')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información del Rol', {
            'fields': ('role', 'matricula', 'carrera', 'telefono', 'fecha_ingreso', 'activo')
        }),
        ('Información de Tutor', {
            'fields': ('especialidad', 'grado_academico'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Información del Rol', {
            'fields': ('role', 'email', 'matricula')
        }),
    )

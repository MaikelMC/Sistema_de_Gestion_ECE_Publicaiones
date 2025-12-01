from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PasswordHistory, FailedLoginIP

try:
    from requests.utils import log_event
except Exception:
    log_event = None


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin personalizado para el modelo User
    """
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'anno', 'activo', 'failed_login_attempts', 'locked_until')
    list_filter = ('role', 'activo', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'anno')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información del Rol', {
            'fields': ('role', 'anno', 'carrera', 'telefono', 'fecha_ingreso', 'activo')
        }),
        ('Información de Tutor', {
            'fields': ('especialidad', 'grado_academico'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Información del Rol', {
            'fields': ('role', 'email', 'anno')
        }),
    )
    list_display_links = ('username',)
    list_editable = ('role', 'activo')
    list_per_page = 40
    actions = ['unlock_users']

    def unlock_users(self, request, queryset):
        """Acción de admin para desbloquear usuarios seleccionados."""
        updated = queryset.update(failed_login_attempts=0, locked_until=None)
        # Registrar en SystemLog si el helper está disponible
        if log_event:
            for user in queryset:
                log_event(user=request.user, request=request, action='admin_unlock', model_name='User', object_id=user.id,
                          description=f"Usuario desbloqueado por admin {request.user.username}")
        self.message_user(request, f"Desbloqueados {updated} usuarios.")
    unlock_users.short_description = 'Desbloquear usuarios seleccionados'


@admin.register(PasswordHistory)
class PasswordHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    search_fields = ('user__username',)


@admin.register(FailedLoginIP)
class FailedLoginIPAdmin(admin.ModelAdmin):
    list_display = ('ip_address', 'attempts', 'last_attempt', 'blocked_until')
    search_fields = ('ip_address',)

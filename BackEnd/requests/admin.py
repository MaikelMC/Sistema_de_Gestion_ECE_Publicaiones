from django.contrib import admin
from .models import ECERequest, SystemLog, SystemConfiguration


@admin.register(ECERequest)
class ECERequestAdmin(admin.ModelAdmin):
    list_display = ('student', 'status', 'created_at', 'review_date')
    list_filter = ('status', 'created_at', 'review_date')
    search_fields = ('student__username', 'student__matricula', 'description')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'model_name', 'created_at')
    list_filter = ('action', 'model_name', 'created_at')
    search_fields = ('user__username', 'description', 'model_name')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(SystemConfiguration)
class SystemConfigurationAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'is_active', 'updated_at')
    list_filter = ('is_active', 'updated_at')
    search_fields = ('key', 'description')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('key',)

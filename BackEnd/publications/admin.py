from django.contrib import admin
from .models import Publication, TutorOpinion, TutorStudent


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'nivel', 'status', 'created_at')
    list_filter = ('status', 'nivel', 'created_at')
    search_fields = ('title', 'authors', 'student__username', 'doi')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(TutorOpinion)
class TutorOpinionAdmin(admin.ModelAdmin):
    list_display = ('publication', 'tutor', 'recommendation', 'created_at')
    list_filter = ('recommendation', 'created_at')
    search_fields = ('publication__title', 'tutor__username', 'opinion')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(TutorStudent)
class TutorStudentAdmin(admin.ModelAdmin):
    list_display = ('tutor', 'student', 'is_active', 'progress', 'assigned_date')
    list_filter = ('is_active', 'assigned_date')
    search_fields = ('tutor__username', 'student__username')
    readonly_fields = ('assigned_date', 'created_at', 'updated_at')
    ordering = ('-assigned_date',)

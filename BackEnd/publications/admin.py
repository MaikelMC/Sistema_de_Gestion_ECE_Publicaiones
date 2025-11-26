from django.contrib import admin
from .models import Publication, TutorOpinion, TutorStudent


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'nivel', 'status', 'created_at')
    list_filter = ('status', 'nivel', 'created_at')
    search_fields = ('title', 'authors', 'student__username', 'doi')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    list_display_links = ('title',)
    list_editable = ('nivel', 'status')
    date_hierarchy = 'created_at'
    list_per_page = 30
    actions = ['mark_as_pending', 'mark_as_approved', 'mark_as_rejected']

    def mark_as_pending(self, request, queryset):
        updated = queryset.update(status='pending')
        self.message_user(request, f"{updated} publicaciones marcadas como 'pending'.")
    mark_as_pending.short_description = "Marcar seleccionadas como 'pending'"

    def mark_as_approved(self, request, queryset):
        updated = queryset.update(status='approved')
        self.message_user(request, f"{updated} publicaciones marcadas como 'approved'.")
    mark_as_approved.short_description = "Marcar seleccionadas como 'approved'"

    def mark_as_rejected(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f"{updated} publicaciones marcadas como 'rejected'.")
    mark_as_rejected.short_description = "Marcar seleccionadas como 'rejected'"


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

from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator

class Publication(models.Model):
    """
    Modelo para gestionar publicaciones científicas de estudiantes
    """
    STATUS_CHOICES = (
        ('en_proceso', 'En Proceso'),
        ('pending', 'Pendiente de Revisión'),
        ('approved', 'Aprobada'),
        ('rejected', 'Rechazada'),
    )
    
    NIVEL_CHOICES = (
        ('1', 'Nivel 1'),
        ('2', 'Nivel 2'),
        ('3', 'Nivel 3'),
    )
    
    # Relaciones
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='publications',
        limit_choices_to={'role': 'estudiante'}
    )
    tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='publications_as_tutor',
        limit_choices_to={'role': 'tutor'}
    )
    
    # Información de la publicación
    title = models.CharField('Título', max_length=500)
    authors = models.TextField('Autores')
    publication_date = models.DateField('Fecha de Publicación', null=True, blank=True)
    journal = models.CharField('Revista', max_length=300, blank=True, default='')
    volume = models.CharField('Volumen', max_length=50, null=True, blank=True)
    pages = models.CharField('Páginas', max_length=50, null=True, blank=True)
    doi = models.CharField('DOI', max_length=200, null=True, blank=True)
    abstract = models.TextField('Resumen', null=True, blank=True)
    
    # Archivo PDF
    file = models.FileField(
        'Archivo',
        upload_to='publications/%Y/%m/',
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx'])],
        null=True,
        blank=True
    )
    
    # Nivel y estado
    nivel = models.CharField('Nivel', max_length=1, choices=NIVEL_CHOICES)
    status = models.CharField('Estado', max_length=20, choices=STATUS_CHOICES, default='en_proceso')
    
    # Revisión
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='publications_reviewed',
        limit_choices_to={'role': 'jefe'}
    )
    review_comments = models.TextField('Comentarios de Revisión', null=True, blank=True)
    review_date = models.DateTimeField('Fecha de Revisión', null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)
    
    class Meta:
        db_table = 'publications'
        verbose_name = 'Publicación'
        verbose_name_plural = 'Publicaciones'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.student.get_full_name()}"


class TutorOpinion(models.Model):
    """
    Modelo para opiniones de tutores sobre publicaciones
    """
    RECOMMENDATION_CHOICES = (
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
        ('revision', 'Requiere Revisión'),
    )
    
    publication = models.ForeignKey(
        Publication,
        on_delete=models.CASCADE,
        related_name='tutor_opinions'
    )
    tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='opinions',
        limit_choices_to={'role': 'tutor'}
    )
    
    opinion = models.TextField('Opinión')
    recommendation = models.CharField(
        'Recomendación',
        max_length=20,
        choices=RECOMMENDATION_CHOICES
    )
    
    created_at = models.DateTimeField('Fecha de Opinión', auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tutor_opinions'
        verbose_name = 'Opinión de Tutor'
        verbose_name_plural = 'Opiniones de Tutores'
        ordering = ['-created_at']
        unique_together = ['publication', 'tutor']
    
    def __str__(self):
        return f"Opinión de {self.tutor.get_full_name()} - {self.publication.title[:50]}"


class TutorStudent(models.Model):
    """
    Modelo para relación Tutor-Estudiante
    """
    tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='students_assigned',
        limit_choices_to={'role': 'tutor'}
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tutors_assigned',
        limit_choices_to={'role': 'estudiante'}
    )
    
    assigned_date = models.DateField('Fecha de Asignación', auto_now_add=True)
    is_active = models.BooleanField('Activo', default=True)
    progress = models.IntegerField('Progreso (%)', default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tutor_students'
        verbose_name = 'Relación Tutor-Estudiante'
        verbose_name_plural = 'Relaciones Tutor-Estudiante'
        unique_together = ['tutor', 'student']
    
    def __str__(self):
        return f"{self.tutor.get_full_name()} -> {self.student.get_full_name()}"

from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    PublicationViewSet, TutorOpinionViewSet, TutorStudentViewSet
)

router = DefaultRouter()
router.register(r'publications', PublicationViewSet, basename='publication')
router.register(r'tutor-opinions', TutorOpinionViewSet, basename='tutor-opinion')
router.register(r'tutor-students', TutorStudentViewSet, basename='tutor-student')

urlpatterns = router.urls

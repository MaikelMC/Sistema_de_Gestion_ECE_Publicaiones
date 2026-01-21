from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    PublicationViewSet, TutorOpinionViewSet, TutorStudentViewSet, StudentOpinionViewSet
)

router = DefaultRouter()
# Register specific resources FIRST so they take precedence
# Then register the generic PublicationViewSet last with empty string
router.register(r'tutor-opinions', TutorOpinionViewSet, basename='tutor-opinion')
router.register(r'tutor-students', TutorStudentViewSet, basename='tutor-student')
router.register(r'student-opinions', StudentOpinionViewSet, basename='student-opinion')
# Register the primary resources at the app root so when this urls.py is
# included under `/api/publications/` the endpoints become:
#   - /api/publications/            -> PublicationViewSet
#   - /api/publications/{pk}/       -> Publication detail
router.register(r'', PublicationViewSet, basename='publication')

urlpatterns = router.urls

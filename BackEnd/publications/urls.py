from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    PublicationViewSet, TutorOpinionViewSet, TutorStudentViewSet
)

router = DefaultRouter()
# Register the primary resources at the app root so when this urls.py is
# included under `/api/publications/` the endpoints become:
#   - /api/publications/            -> PublicationViewSet
#   - /api/publications/{pk}/       -> Publication detail
# Additional resources remain as subpaths.
router.register(r'', PublicationViewSet, basename='publication')
router.register(r'tutor-opinions', TutorOpinionViewSet, basename='tutor-opinion')
router.register(r'tutor-students', TutorStudentViewSet, basename='tutor-student')

urlpatterns = router.urls
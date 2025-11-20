from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, LoginView, RegisterView, LogoutView,
    ChangePasswordView, ProfileView, ProfileStatsView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Authentication
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/stats/', ProfileStatsView.as_view(), name='profile-stats'),
]

urlpatterns += router.urls

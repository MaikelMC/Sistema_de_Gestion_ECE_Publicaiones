"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
import importlib
from django.apps import apps as dj_apps

# Intento cargar el SystemLogViewSet de la app local `requests` de forma dinámica
# para evitar colisiones con la librería externa `requests`.
SystemLogViewSet = None
try:
    req_app = dj_apps.get_app_config('requests')
    try:
        req_views = importlib.import_module(f"{req_app.name}.views")
        SystemLogViewSet = getattr(req_views, 'SystemLogViewSet', None)
    except Exception:
        SystemLogViewSet = None
except Exception:
    SystemLogViewSet = None

# Swagger Schema View
schema_view = get_schema_view(
    openapi.Info(
        title="Sistema ECE - API Documentation",
        default_version='v1',
        description="""
        Sistema de Gestión de Estudios Científicos Estudiantiles (ECE)
        
        ## Descripción
        API para la gestión de publicaciones científicas y solicitudes ECE de estudiantes.
        
        ## Roles del Sistema:
        - **Estudiante**: Gestionar sus publicaciones y solicitudes ECE
        - **Tutor**: Revisar publicaciones de estudiantes asignados
        - **Jefe de Departamento**: Aprobar/rechazar publicaciones y solicitudes
        - **Administrador**: Gestión completa del sistema
        
        ## Autenticación
        El sistema utiliza JWT (JSON Web Tokens) para autenticación.
        Utiliza el endpoint `/api/auth/login/` para obtener tus tokens.
        
        ## Estructura de APIs:
        - **Autenticación**: `/api/auth/`
        - **Publicaciones**: `/api/publications/`
        - **Solicitudes ECE**: `/api/requests/`
        """,
        terms_of_service="https://www.tu-universidad.com/terms/",
        contact=openapi.Contact(email="soporte.ece@tu-universidad.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # JWT Token Endpoints (opcionales - ya tienes login personalizado)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API Endpoints: mount each app under its own prefix to avoid mixing resources
    path('api/auth/', include('authentication.urls')),
    path('api/publications/', include('publications.urls')),
    # Para evitar colisión con la librería externa `requests`, incluimos el
    # módulo `urls` de la app local `requests` usando su nombre de app
    # obtenido desde `django.apps`.
]

requests_include_path = 'requests.urls'
try:
    req_app = dj_apps.get_app_config('requests')
    requests_include_path = f"{req_app.name}.urls"
except Exception:
    requests_include_path = 'requests.urls'

urlpatterns += [
    path('api/requests/', include(requests_include_path)),
    # Fallback explícito para exponer SystemLog en caso de conflicto de nombres.
    # Registramos tanto `/api/system-logs/` como `/api/requests/system-logs/`.
]

if SystemLogViewSet is not None:
    urlpatterns += [
        re_path(r'^api/system-logs/$', SystemLogViewSet.as_view({'get': 'list'})),
        re_path(r'^api/system-logs/(?P<pk>\d+)/$', SystemLogViewSet.as_view({'get': 'retrieve'})),
        re_path(r'^api/requests/system-logs/$', SystemLogViewSet.as_view({'get': 'list'})),
        re_path(r'^api/requests/system-logs/(?P<pk>\d+)/$', SystemLogViewSet.as_view({'get': 'retrieve'})),
    ]
else:
    # Si no se pudo cargar dinámicamente, no agregamos rutas adicionales.
    pass

# Añadimos las rutas de documentación Swagger y la raíz de la API
urlpatterns += [
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    # API Root - Redirige a Swagger
    path('', schema_view.with_ui('swagger', cache_timeout=0), name='api-root'),
]

# Personalizar encabezados del admin
admin.site.site_header = 'Sistema ECE — Panel de Administración'
admin.site.site_title = 'Sistema ECE Admin'
admin.site.index_title = 'Administración — Sistema ECE'

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom error handlers (Django will use these when DEBUG=False)
handler400 = 'config.views.custom_400'
handler403 = 'config.views.custom_403'
handler404 = 'config.views.custom_404'
handler500 = 'config.views.custom_500'
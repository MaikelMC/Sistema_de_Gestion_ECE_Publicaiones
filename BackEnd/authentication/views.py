from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    LoginSerializer, ChangePasswordSerializer, UserListSerializer
)
# Agregar serializer para reset de contraseña
from .serializers import ResetPasswordSerializer
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD de usuarios
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'list':
            return UserListSerializer
        return UserSerializer
    
    def perform_create(self, serializer):
        """Log user creation"""
        user = serializer.save()
        try:
            from requests.utils import log_event
            log_event(user=self.request.user, request=self.request, action='user_create', 
                      model_name='User', object_id=user.id,
                      description=f"Usuario creado: {user.username} (rol: {user.role})")
        except Exception:
            pass
    
    def perform_update(self, serializer):
        """Log user update"""
        user = serializer.save()
        try:
            from requests.utils import log_event
            log_event(user=self.request.user, request=self.request, action='user_update', 
                      model_name='User', object_id=user.id,
                      description=f"Usuario actualizado: {user.username}")
        except Exception:
            pass
    
    def perform_destroy(self, instance):
        """Log user deletion"""
        try:
            from requests.utils import log_event
            log_event(user=self.request.user, request=self.request, action='user_delete', 
                      model_name='User', object_id=instance.id,
                      description=f"Usuario eliminado: {instance.username}")
        except Exception:
            pass
        instance.delete()
    
    @swagger_auto_schema(
        operation_description="Obtener lista de usuarios con filtros opcionales",
        manual_parameters=[
            openapi.Parameter(
                'role', openapi.IN_QUERY,
                description="Filtrar por rol (estudiante, tutor, jefe, admin)",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'activo', openapi.IN_QUERY,
                description="Filtrar por estado activo (true/false)",
                type=openapi.TYPE_BOOLEAN
            )
        ],
        tags=['Autenticación - Usuarios']
    )
    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.all()
        
        # Filtrar por rol si se proporciona
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filtrar activos/inactivos
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        
        return queryset.order_by('-created_at')
    
    @swagger_auto_schema(
        operation_description="Obtener información del usuario actual",
        responses={200: UserSerializer},
        tags=['Autenticación - Usuarios']
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener información del usuario actual"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Listar solo estudiantes activos",
        responses={200: UserListSerializer(many=True)},
        tags=['Autenticación - Usuarios']
    )
    @action(detail=False, methods=['get'])
    def estudiantes(self, request):
        """Listar solo estudiantes"""
        estudiantes = User.objects.filter(role='estudiante', activo=True)
        serializer = UserListSerializer(estudiantes, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Listar solo tutores activos",
        responses={200: UserListSerializer(many=True)},
        tags=['Autenticación - Usuarios']
    )
    @action(detail=False, methods=['get'])
    def tutores(self, request):
        """Listar solo tutores"""
        tutores = User.objects.filter(role='tutor', activo=True)
        serializer = UserListSerializer(tutores, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Obtener estadísticas de usuarios",
        responses={
            200: openapi.Response(
                description="Estadísticas de usuarios",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'total': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'activos': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'inactivos': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'por_rol': openapi.Schema(type=openapi.TYPE_OBJECT),
                    }
                )
            )
        },
        tags=['Autenticación - Usuarios']
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de usuarios"""
        from django.db.models import Count
        
        # Total de usuarios
        total = User.objects.count()
        activos = User.objects.filter(activo=True).count()
        inactivos = User.objects.filter(activo=False).count()
        
        # Por rol
        por_rol = User.objects.values('role').annotate(
            count=Count('id')
        ).order_by('role')
        
        return Response({
            'total': total,
            'activos': activos,
            'inactivos': inactivos,
            'por_rol': {item['role']: item['count'] for item in por_rol}
        })
    
    @swagger_auto_schema(
        operation_description="Obtener perfil completo del usuario actual con estadísticas",
        responses={200: UserSerializer},
        tags=['Autenticación - Usuarios']
    )
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Obtener perfil completo del usuario actual con estadísticas"""
        try:
            from requests.models import ECERequest, TutorOpinion
            from publications.models import Publication
            from django.db.models import Count, Q
            from django.utils import timezone
            
            user = request.user
            serializer = UserSerializer(user)
            profile_data = serializer.data
            
            # Estadísticas según el rol
            if user.role == 'jefe':
                # Solicitudes revisadas por el jefe
                solicitudes_revisadas = ECERequest.objects.filter(reviewed_by=user).count()
                
                # Publicaciones clasificadas (aprobadas)
                publicaciones_clasificadas = Publication.objects.filter(
                    reviewed_by=user
                ).count()
                
                # Estudiantes activos en el departamento
                estudiantes_activos = User.objects.filter(
                    role='estudiante',
                    activo=True
                ).count()
                
                # Tiempo promedio de revisión (en días)
                revisadas_con_tiempo = ECERequest.objects.filter(
                    reviewed_by=user,
                    review_date__isnull=False,
                    created_at__isnull=False
                )
                
                tiempo_promedio = 0
                if revisadas_con_tiempo.exists():
                    count = 0
                    for req in revisadas_con_tiempo:
                        if req.review_date and req.created_at:
                            diff = (req.review_date - req.created_at).total_seconds() / 86400
                            tiempo_promedio += diff
                            count += 1
                    tiempo_promedio = round(tiempo_promedio / count, 1) if count > 0 else 0
                
                # Actividad reciente
                actividades = []
                
                # Últimas solicitudes revisadas
                solicitudes_recientes = ECERequest.objects.filter(
                    reviewed_by=user,
                    review_date__isnull=False
                ).select_related('student').order_by('-review_date')[:3]
                
                for req in solicitudes_recientes:
                    if req.student:
                        actividades.append({
                            'tipo': 'solicitud',
                            'estado': req.status,
                            'estudiante': req.student.get_full_name(),
                            'fecha': req.review_date
                        })
                
                # Publicaciones recientes clasificadas
                pubs_recientes = Publication.objects.filter(
                    reviewed_by=user,
                    review_date__isnull=False
                ).select_related('student').order_by('-review_date')[:3]
                
                for pub in pubs_recientes:
                    if pub.student:
                        actividades.append({
                            'tipo': 'publicacion',
                            'nivel': pub.nivel,
                            'estudiante': pub.student.get_full_name(),
                            'fecha': pub.review_date
                        })
                
                # Ordenar por fecha
                actividades.sort(key=lambda x: x['fecha'] if x['fecha'] else timezone.now(), reverse=True)
                
                profile_data['stats'] = {
                    'solicitudes_revisadas': solicitudes_revisadas,
                    'publicaciones_clasificadas': publicaciones_clasificadas,
                    'estudiantes_activos': estudiantes_activos,
                    'tiempo_promedio': f"{tiempo_promedio} días"
                }
                profile_data['actividad_reciente'] = actividades[:5]
            
            elif user.role == 'estudiante':
                # Estadísticas para estudiante
                mis_solicitudes = ECERequest.objects.filter(student=user).count()
                solicitudes_aprobadas = ECERequest.objects.filter(student=user, status='aprobada').count()
                mis_publicaciones = Publication.objects.filter(student=user).count()
                publicaciones_aprobadas = Publication.objects.filter(student=user, status='approved').count()
                
                profile_data['stats'] = {
                    'mis_solicitudes': mis_solicitudes,
                    'solicitudes_aprobadas': solicitudes_aprobadas,
                    'mis_publicaciones': mis_publicaciones,
                    'publicaciones_aprobadas': publicaciones_aprobadas
                }
            
            elif user.role == 'tutor':
                # Estadísticas para tutor
                mis_estudiantes = User.objects.filter(tutor=user, activo=True).count()
                opiniones_emitidas = TutorOpinion.objects.filter(tutor=user).count()
                publicaciones_revisadas = TutorOpinion.objects.filter(tutor=user).values('publication').distinct().count()
                
                profile_data['stats'] = {
                    'mis_estudiantes': mis_estudiantes,
                    'opiniones_emitidas': opiniones_emitidas,
                    'publicaciones_revisadas': publicaciones_revisadas
                }
            
            return Response(profile_data)
        
        except Exception as e:
            # Log del error
            import traceback
            print(f"Error en profile endpoint: {str(e)}")
            print(traceback.format_exc())
            
            # Devolver respuesta básica sin stats si hay error
            serializer = UserSerializer(request.user)
            return Response({
                **serializer.data,
                'stats': {},
                'actividad_reciente': []
            })


class LoginView(generics.GenericAPIView):
    """
    Vista para login de usuarios
    """
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    
    @swagger_auto_schema(
        operation_description="Iniciar sesión en el sistema",
        request_body=LoginSerializer,
        responses={
            200: openapi.Response(
                description="Login exitoso",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'user': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'tokens': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                                'access': openapi.Schema(type=openapi.TYPE_STRING),
                            }
                        )
                    }
                )
            ),
            400: "Credenciales inválidas"
        },
        tags=['Autenticación - Auth']
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            # Si la validación falló, comprobar si la cuenta fue bloqueada en este momento
            username = request.data.get('username')
            if username:
                try:
                    from authentication.models import User
                    from django.utils import timezone
                    u = User.objects.filter(username=username).first()
                    if u and u.locked_until and u.locked_until > timezone.now():
                        remaining = (u.locked_until - timezone.now()).total_seconds()
                        minutes = int(remaining // 60) + (1 if remaining % 60 > 0 else 0)
                        return Response({
                            'detail': 'Cuenta temporalmente bloqueada.',
                            'locked_minutes': minutes,
                            'locked_until': u.locked_until
                        }, status=423)
                except Exception:
                    pass
            # Re-lanzar la excepción original
            raise

        user = serializer.validated_data['user']

        # Disparar señal de login exitoso para que se registre en el log
        from django.contrib.auth.signals import user_logged_in
        user_logged_in.send(sender=user.__class__, request=request, user=user)

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'anno': user.anno,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    """
    Vista para registro de nuevos usuarios
    """
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]
    
    @swagger_auto_schema(
        operation_description="Registrar nuevo usuario en el sistema",
        request_body=UserCreateSerializer,
        responses={
            201: openapi.Response(
                description="Usuario registrado exitosamente",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'user': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'tokens': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'message': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: "Datos de registro inválidos"
        },
        tags=['Autenticación - Auth']
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Usuario registrado exitosamente'
        }, status=status.HTTP_201_CREATED)


class LogoutView(generics.GenericAPIView):
    """
    Vista para logout
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Cerrar sesión del sistema",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'refresh_token': openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        responses={
            200: openapi.Response(
                description="Sesión cerrada exitosamente",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: "Token inválido"
        },
        tags=['Autenticación - Auth']
    )
    def post(self, request):
        try:
            # Log evento de logout
            try:
                from requests.utils import log_event
                log_event(user=request.user, request=request, action='logout', model_name='User', 
                          object_id=request.user.id, description=f"Logout: {request.user.username}")
            except Exception:
                pass
            
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Sesión cerrada exitosamente'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Token inválido'}, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(generics.GenericAPIView):
    """
    Vista para cambiar contraseña
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Cambiar contraseña del usuario actual",
        request_body=ChangePasswordSerializer,
        responses={
            200: openapi.Response(
                description="Contraseña actualizada exitosamente",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: "Datos inválidos"
        },
        tags=['Autenticación - Auth']
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'message': 'Contraseña actualizada exitosamente'
        }, status=status.HTTP_200_OK)


class ResetPasswordView(generics.GenericAPIView):
    """
    Vista para resetear contraseña mediante username + email + nueva contraseña.
    """
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Resetear contraseña con usuario y correo",
        request_body=ResetPasswordSerializer,
        responses={
            200: openapi.Response(description="Contraseña actualizada"),
            400: "Datos inválidos"
        },
        tags=['Autenticación - Auth']
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Contraseña restablecida correctamente'}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Vista para ver y actualizar perfil del usuario actual
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
    
    @swagger_auto_schema(
        operation_description="Obtener perfil del usuario actual",
        responses={200: UserSerializer},
        tags=['Autenticación - Perfil']
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Actualizar perfil del usuario actual",
        request_body=UserUpdateSerializer,
        responses={200: UserSerializer},
        tags=['Autenticación - Perfil']
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Actualizar parcialmente perfil del usuario actual",
        request_body=UserUpdateSerializer,
        responses={200: UserSerializer},
        tags=['Autenticación - Perfil']
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class ProfileStatsView(generics.GenericAPIView):
    """
    Vista para obtener estadísticas del usuario actual
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Obtener estadísticas del usuario según su rol",
        responses={
            200: openapi.Response(
                description="Estadísticas del usuario",
                schema=openapi.Schema(type=openapi.TYPE_OBJECT)
            )
        },
        tags=['Autenticación - Perfil']
    )
    def get(self, request):
        user = request.user
        stats = {}
        
        if user.role == 'estudiante':
            from publications.models import Publication
            from requests.models import ECERequest
            
            publicaciones = Publication.objects.filter(student=user)
            solicitudes = ECERequest.objects.filter(student=user)
            
            stats = {
                'publicaciones_enviadas': publicaciones.count(),
                'publicaciones_aprobadas': publicaciones.filter(status='approved').count(),
                'publicaciones_rechazadas': publicaciones.filter(status='rejected').count(),
                'publicaciones_pendientes': publicaciones.filter(status='pending').count(),
                'solicitudes_enviadas': solicitudes.count(),
                'solicitudes_aprobadas': solicitudes.filter(status='aprobada').count(),
                'solicitudes_rechazadas': solicitudes.filter(status='rechazada').count(),
                'rechazos_totales': publicaciones.filter(status='rejected').count() + solicitudes.filter(status='rechazada').count()
            }
        
        elif user.role == 'tutor':
            from publications.models import TutorStudent, TutorOpinion, Publication
            
            alumnos = TutorStudent.objects.filter(tutor=user, is_active=True)
            student_ids = alumnos.values_list('student_id', flat=True)
            publicaciones_alumnos = Publication.objects.filter(student_id__in=student_ids)
            
            stats = {
                'total_alumnos': alumnos.count(),
                'alumnos_activos': alumnos.filter(is_active=True).count(),
                'solicitudes_pendientes': publicaciones_alumnos.filter(status='pending').count(),
                'opiniones_emitidas': TutorOpinion.objects.filter(tutor=user).count()
            }
        
        elif user.role == 'jefe':
            from publications.models import Publication
            from requests.models import ECERequest
            
            stats = {
                'publicaciones_pendientes': Publication.objects.filter(status='pending').count(),
                'solicitudes_pendientes': ECERequest.objects.filter(status='pendiente').count(),
                'publicaciones_revisadas': Publication.objects.filter(reviewed_by=user).count(),
                'solicitudes_revisadas': ECERequest.objects.filter(reviewed_by=user).count()
            }
        
        elif user.role == 'admin':
            from publications.models import Publication
            from requests.models import ECERequest
            
            total_users = User.objects.count()
            stats = {
                'total_usuarios': total_users,
                'total_estudiantes': User.objects.filter(role='estudiante').count(),
                'total_tutores': User.objects.filter(role='tutor').count(),
                'total_jefes': User.objects.filter(role='jefe').count(),
                'total_publicaciones': Publication.objects.count(),
                'total_solicitudes': ECERequest.objects.count()
            }
        
        return Response(stats, status=status.HTTP_200_OK)
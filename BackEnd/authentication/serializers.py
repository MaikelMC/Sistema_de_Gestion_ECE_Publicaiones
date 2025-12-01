from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User
from .models import FailedLoginIP
from django.core.exceptions import ValidationError
from django.utils import timezone


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo User - Lectura
    """
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'anno', 'carrera', 'telefono',
            'fecha_ingreso', 'activo', 'especialidad', 'grado_academico',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear usuarios
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirmar contraseña")
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2', 'first_name', 
            'last_name', 'role', 'anno', 'carrera', 'telefono',
            'fecha_ingreso', 'especialidad', 'grado_academico'
        ]
        extra_kwargs = {
            'anno': {'required': False, 'allow_null': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return value

    def validate_anno(self, value):
        if value is not None:
            # Aceptar valores entre 1 y 4 (inclusive)
            if value < 1 or value > 4:
                raise serializers.ValidationError("El año debe estar entre 1 y 4.")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar usuarios
    """
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'role', 'anno', 'carrera',
            'telefono', 'fecha_ingreso', 'especialidad', 'grado_academico', 'activo'
        ]
    
    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Este correo ya está en uso.")
        return value


class LoginSerializer(serializers.Serializer):
    """
    Serializer para login
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Comprobar bloqueo por intentos fallidos antes de autenticar
            try:
                user_obj = User.objects.filter(username=username).first()
            except Exception:
                user_obj = None
            # Comprobar bloqueo por usuario
            if user_obj and user_obj.locked_until and user_obj.locked_until > timezone.now():
                raise serializers.ValidationError('Cuenta temporalmente bloqueada. Intente más tarde.')

            # Comprobar bloqueo por IP
            req = self.context.get('request')
            if req is not None:
                xff = req.META.get('HTTP_X_FORWARDED_FOR')
                ip = xff.split(',')[0].strip() if xff else req.META.get('REMOTE_ADDR')
                try:
                    ip_rec = FailedLoginIP.objects.filter(ip_address=ip).first()
                except Exception:
                    ip_rec = None
                if ip_rec and ip_rec.blocked_until and ip_rec.blocked_until > timezone.now():
                    raise serializers.ValidationError('Intentos desde esta IP temporalmente bloqueados.')

            user = authenticate(username=username, password=password)

            if not user:
                # Disparar señal de login fallido para que se registre
                from django.contrib.auth.signals import user_login_failed
                user_login_failed.send(
                    sender=__name__,
                    credentials={'username': username},
                    request=req
                )
                raise serializers.ValidationError('Credenciales inválidas.')

            if not user.is_active:
                raise serializers.ValidationError('Usuario inactivo.')

            # Si pasó la autenticación, devolver user
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Debe incluir username y password.')


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer para cambiar contraseña
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Las contraseñas no coinciden."})
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value
    
    def save(self, **kwargs):
        user = self.context['request'].user
        # Comprobar reutilización de contraseñas (últimas 5)
        new_pw = self.validated_data['new_password']
        if user.is_password_reused(new_pw, history_count=5):
            raise serializers.ValidationError({'new_password': 'No puede reutilizar una contraseña reciente.'})
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar usuarios
    """
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 'role_display',
            'anno', 'activo', 'created_at'
        ]
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

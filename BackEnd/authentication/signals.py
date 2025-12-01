from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.conf import settings
from django.apps import apps
from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.utils import timezone

# Evitar import circular: obtener modelo dinámicamente
User = apps.get_model(settings.AUTH_USER_MODEL)

from .models import PasswordHistory
from .models import FailedLoginIP

# Intentos por IP
IP_THRESHOLD = getattr(settings, 'AUTH_IP_LOCKOUT_THRESHOLD', 20)
IP_LOCK_MINUTES = getattr(settings, 'AUTH_IP_LOCKOUT_MINUTES', 60)

# SystemLog (auditoría) y notificaciones
try:
    from requests.utils import log_event, create_notification, check_simultaneous_access
except Exception:
    log_event = None
    create_notification = None
    check_simultaneous_access = None


# Configuración por defecto
LOCKOUT_THRESHOLD = getattr(settings, 'AUTH_LOCKOUT_THRESHOLD', 5)
LOCKOUT_MINUTES = getattr(settings, 'AUTH_LOCKOUT_MINUTES', 15)


@receiver(pre_save, sender=User)
def save_password_history(sender, instance, **kwargs):
    """
    Antes de guardar un usuario, si la contraseña ha cambiado, guardar
    el hash anterior en PasswordHistory.
    """
    if not instance.pk:
        # Usuario nuevo, no hay historial previo a guardar
        return

    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    old_password = old.password
    new_password = instance.password

    if old_password and old_password != new_password:
        # Guardar el hash antiguo en el historial
        PasswordHistory.objects.create(user=instance, password=old_password)


@receiver(user_login_failed)
def handle_login_failed(sender, credentials, request, **kwargs):
    """Incrementa contador de intentos fallidos y bloquea usuario si excede umbral."""
    username = None
    if isinstance(credentials, dict):
        username = credentials.get('username') or credentials.get('email')
    if not username:
        return

    print(f"[handle_login_failed] Signal recibido para username: {username}")

    try:
        user = User.objects.filter(username=username).first()
    except Exception:
        user = None

    # Log intento fallido incluso si el usuario no existe
    print(f"[handle_login_failed] log_event disponible: {log_event is not None}")
    if log_event:
        result = log_event(user=user, request=request, action='login_failed', model_name='User', 
                  object_id=user.id if user else None,
                  description=f"Login fallido para username: {username}")
        print(f"[handle_login_failed] Resultado log_event: {result}")
    
    # Crear notificación para intento fallido
    if create_notification and user:
        # Solo notificar después de 3 intentos fallidos
        current_attempts = (user.failed_login_attempts or 0) + 1
        if current_attempts >= 3:
            create_notification(
                notification_type='failed_login',
                severity='warning' if current_attempts < LOCKOUT_THRESHOLD else 'error',
                title=f'Múltiples intentos fallidos: {username}',
                message=f'Se han detectado {current_attempts} intentos fallidos de login para el usuario {username}',
                user=user,
                request=request,
                metadata={'attempts': current_attempts, 'threshold': LOCKOUT_THRESHOLD}
            )

    if not user:
        return

    # Obtener IP del request
    ip = None
    if request is not None:
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')

    # Primero actualizar contador por IP
    if ip:
        ip_rec, _ = FailedLoginIP.objects.get_or_create(ip_address=ip)
        # Si IP ya bloqueada, no hacer nada más
        if ip_rec.blocked_until and ip_rec.blocked_until > timezone.now():
            # Opcional: crear SystemLog para intento desde IP bloqueada
            if log_event:
                log_event(user=None, request=request, action='ip_blocked_attempt', model_name='IP', object_id=None,
                          description=f"Attempt from blocked IP {ip}")
            return

        ip_rec.attempts = (ip_rec.attempts or 0) + 1
        ip_rec.last_attempt = timezone.now()
        if ip_rec.attempts >= IP_THRESHOLD:
            ip_rec.blocked_until = timezone.now() + timezone.timedelta(minutes=IP_LOCK_MINUTES)
            ip_rec.attempts = 0
            # Log evento de bloqueo de IP
            if log_event:
                log_event(user=None, request=request, action='ip_block', model_name='IP', object_id=None,
                          description=f"IP {ip} bloqueada por exceso de intentos")
            
            # Notificación de bloqueo de IP
            if create_notification:
                create_notification(
                    notification_type='ip_blocked',
                    severity='error',
                    title=f'IP bloqueada: {ip}',
                    message=f'La IP {ip} ha sido bloqueada tras {IP_THRESHOLD} intentos fallidos',
                    user=None,
                    request=request,
                    metadata={'ip_address': ip, 'lockout_minutes': IP_LOCK_MINUTES}
                )
        ip_rec.save(update_fields=['attempts', 'last_attempt', 'blocked_until'])

    # Si ya está bloqueado y aún dentro del periodo, no modificar
    if user.locked_until and user.locked_until > timezone.now():
        return

    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= LOCKOUT_THRESHOLD:
        user.locked_until = timezone.now() + timezone.timedelta(minutes=LOCKOUT_MINUTES)
        user.failed_login_attempts = 0
        # Log evento de bloqueo de usuario
        if log_event:
            log_event(user=user, request=request, action='user_lock', model_name='User', object_id=user.id,
                      description=f"Usuario bloqueado por exceso de intentos")
        
        # Notificación crítica de bloqueo
        if create_notification:
            create_notification(
                notification_type='user_locked',
                severity='critical',
                title=f'Usuario bloqueado: {username}',
                message=f'El usuario {username} ha sido bloqueado automáticamente tras {LOCKOUT_THRESHOLD} intentos fallidos',
                user=user,
                request=request,
                metadata={'ip_address': ip, 'lockout_minutes': LOCKOUT_MINUTES}
            )
        
        # Notificar al usuario por email si tiene correo
        try:
            if user.email:
                subject = 'Cuenta temporalmente bloqueada'
                minutes = LOCKOUT_MINUTES
                message = (
                    f"Su cuenta ha sido bloqueada temporalmente por exceso de intentos de inicio de sesión. "
                    f"El bloqueo durará aproximadamente {minutes} minutos. Si no reconoce esta actividad, "
                    "por favor contacte con soporte."
                )
                from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or f"no-reply@{settings.ALLOWED_HOSTS[0] if settings.ALLOWED_HOSTS else 'example.com'}"
                send_mail(subject, message, from_email, [user.email], fail_silently=True)
        except Exception:
            # No interrumpir el flujo si el envío falla
            pass
    user.save(update_fields=['failed_login_attempts', 'locked_until'])


@receiver(user_logged_in)
def handle_login_success(sender, request, user, **kwargs):
    """Resetear contador y lock al iniciar sesión correctamente."""
    print(f"[handle_login_success] Signal recibido para usuario: {user.username if user else 'None'}")
    if not user:
        return
    
    # Verificar acceso simultáneo desde diferentes IPs
    if check_simultaneous_access and request:
        check_simultaneous_access(user, request)
    
    user.failed_login_attempts = 0
    user.locked_until = None
    user.save(update_fields=['failed_login_attempts', 'locked_until'])
    
    # Log login exitoso
    print(f"[handle_login_success] log_event disponible: {log_event is not None}")
    if log_event:
        result = log_event(user=user, request=request, action='login_success', model_name='User', object_id=user.id,
                  description=f"Login exitoso: {user.username}")
        print(f"[handle_login_success] Resultado log_event: {result}")
    else:
        print("[handle_login_success] log_event is None, no se puede registrar")

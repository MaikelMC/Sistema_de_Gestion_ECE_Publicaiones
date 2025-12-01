from django.apps import apps
from django.utils import timezone


def log_event(user=None, request=None, action='', model_name='', object_id=None, description=''):
    """Helper central para crear entradas en SystemLog.

    Usa `apps.get_model` para evitar importaciones circulares. Devuelve la instancia creada
    o None en caso de error.
    """
    try:
        SystemLog = apps.get_model('requests', 'SystemLog')
    except Exception as e:
        print(f"[log_event] Error obteniendo modelo SystemLog: {e}")
        return None

    ip = None
    ua = None
    if request is not None:
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')
        ua = request.META.get('HTTP_USER_AGENT')

    try:
        log_entry = SystemLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=object_id,
            description=description,
            ip_address=ip,
            user_agent=ua,
        )
        print(f"[log_event] Log creado: action={action}, user={user}, model={model_name}")
        return log_entry
    except Exception as e:
        print(f"[log_event] Error creando log: {e}")
        import traceback
        traceback.print_exc()
        return None


def create_notification(notification_type, severity, title, message, user=None, ip_address=None, metadata=None, request=None):
    """Helper para crear notificaciones administrativas.
    
    Args:
        notification_type: Tipo de notificación (failed_login, simultaneous_access, etc.)
        severity: Severidad (info, warning, error, critical)
        title: Título breve de la notificación
        message: Mensaje detallado
        user: Usuario relacionado (opcional)
        ip_address: IP relacionada (opcional)
        metadata: Diccionario con datos adicionales (opcional)
        request: Request object para extraer IP y UA (opcional)
    
    Returns:
        AdminNotification instance o None en caso de error
    """
    try:
        AdminNotification = apps.get_model('requests', 'AdminNotification')
    except Exception as e:
        print(f"[create_notification] Error obteniendo modelo AdminNotification: {e}")
        return None
    
    # Extraer IP del request si no se proporcionó
    if not ip_address and request:
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        ip_address = xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')
    
    # Asegurar que metadata sea un dict
    if metadata is None:
        metadata = {}
    
    # Añadir user agent a metadata si está disponible
    if request and 'user_agent' not in metadata:
        metadata['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
    
    try:
        notification = AdminNotification.objects.create(
            notification_type=notification_type,
            severity=severity,
            title=title,
            message=message,
            user=user,
            ip_address=ip_address,
            metadata=metadata
        )
        print(f"[create_notification] Notificación creada: type={notification_type}, severity={severity}")
        return notification
    except Exception as e:
        print(f"[create_notification] Error creando notificación: {e}")
        import traceback
        traceback.print_exc()
        return None


def check_simultaneous_access(user, request):
    """Detecta si un usuario tiene sesiones activas desde diferentes IPs.
    
    Crea una notificación si se detecta acceso simultáneo.
    """
    try:
        ActiveSession = apps.get_model('requests', 'ActiveSession')
    except Exception:
        return
    
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    current_ip = xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')
    
    # Buscar sesiones activas del mismo usuario desde diferentes IPs (últimos 30 minutos)
    from datetime import timedelta
    recent_threshold = timezone.now() - timedelta(minutes=30)
    
    other_sessions = ActiveSession.objects.filter(
        user=user,
        last_activity__gte=recent_threshold
    ).exclude(ip_address=current_ip)
    
    if other_sessions.exists():
        other_ips = list(other_sessions.values_list('ip_address', flat=True).distinct())
        create_notification(
            notification_type='simultaneous_access',
            severity='warning',
            title=f'Acceso simultáneo detectado: {user.username}',
            message=f'El usuario {user.username} tiene sesiones activas desde múltiples IPs: {current_ip} y {", ".join(other_ips)}',
            user=user,
            ip_address=current_ip,
            metadata={'other_ips': other_ips},
            request=request
        )

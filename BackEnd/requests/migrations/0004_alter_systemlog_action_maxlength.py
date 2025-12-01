# Generated manually on 2025-12-01 to increase max_length for action field

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("requests", "0003_alter_systemlog_action"),
    ]

    operations = [
        migrations.AlterField(
            model_name="systemlog",
            name="action",
            field=models.CharField(
                choices=[
                    ("create", "Crear"),
                    ("update", "Actualizar"),
                    ("delete", "Eliminar"),
                    ("login_success", "Login Exitoso"),
                    ("login_failed", "Login Fallido"),
                    ("logout", "Cierre de Sesión"),
                    ("review", "Revisión"),
                    ("approve", "Aprobación"),
                    ("reject", "Rechazo"),
                    ("user_lock", "Bloqueo de Usuario"),
                    ("ip_block", "Bloqueo de IP"),
                    ("ip_blocked_attempt", "Intento desde IP Bloqueada"),
                    ("admin_unlock", "Desbloqueo por Admin"),
                    ("admin_ip_deny", "Acceso Admin Denegado por IP"),
                    ("user_create", "Creación de Usuario"),
                    ("user_update", "Actualización de Usuario"),
                    ("user_delete", "Eliminación de Usuario"),
                    ("permission_change", "Cambio de Permisos"),
                    ("config_change", "Cambio de Configuración"),
                    ("unauthorized_attempt", "Intento de Acceso No Autorizado"),
                    ("system_error", "Error del Sistema"),
                    ("db_error", "Error de Base de Datos"),
                ],
                max_length=50,
                verbose_name="Acción",
            ),
        ),
    ]

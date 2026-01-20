"""
Comando de gestión para limpiar bloqueos de IP y usuarios
"""
from django.core.management.base import BaseCommand
from authentication.models import FailedLoginIP, User
from django.utils import timezone


class Command(BaseCommand):
    help = 'Limpia los bloqueos de IP y usuarios del sistema de autenticación'

    def add_arguments(self, parser):
        parser.add_argument(
            '--ip',
            type=str,
            help='Desbloquear solo una IP específica',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='Solo listar IPs bloqueadas sin eliminar',
        )

    def handle(self, *args, **options):
        if options['list']:
            self.list_blocked()
            return

        if options['ip']:
            self.clear_specific_ip(options['ip'])
            return

        # Limpiar todo
        self.stdout.write(self.style.WARNING('Limpiando todos los bloqueos...'))
        
        # Limpiar bloqueos de IP
        ip_count = FailedLoginIP.objects.all().delete()[0]
        self.stdout.write(self.style.SUCCESS(f'✅ Eliminados {ip_count} registros de bloqueo de IP'))
        
        # Desbloquear usuarios
        user_count = User.objects.filter(locked_until__isnull=False).update(
            failed_login_attempts=0,
            locked_until=None
        )
        self.stdout.write(self.style.SUCCESS(f'✅ Desbloqueados {user_count} usuarios'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Limpieza completada. Puedes intentar iniciar sesión nuevamente.'))

    def list_blocked(self):
        """Lista todas las IPs bloqueadas"""
        self.stdout.write(self.style.WARNING('📊 Estado de bloqueos:\n'))
        
        # IPs bloqueadas
        blocked_ips = FailedLoginIP.objects.filter(blocked_until__gt=timezone.now())
        all_ips = FailedLoginIP.objects.all()
        
        if all_ips.exists():
            self.stdout.write(f'Total de IPs registradas: {all_ips.count()}')
            for record in all_ips:
                status = '🔒 BLOQUEADA' if (record.blocked_until and record.blocked_until > timezone.now()) else '✅ Activa'
                self.stdout.write(f'  {status} - IP: {record.ip_address} | Intentos: {record.attempts}')
        else:
            self.stdout.write(self.style.SUCCESS('✅ No hay IPs registradas'))
        
        # Usuarios bloqueados
        blocked_users = User.objects.filter(locked_until__gt=timezone.now())
        if blocked_users.exists():
            self.stdout.write(f'\n🔒 Usuarios bloqueados: {blocked_users.count()}')
            for user in blocked_users:
                self.stdout.write(f'  - {user.username} (bloqueado hasta: {user.locked_until})')
        else:
            self.stdout.write(self.style.SUCCESS('\n✅ No hay usuarios bloqueados'))

    def clear_specific_ip(self, ip_address):
        """Limpia el bloqueo de una IP específica"""
        try:
            record = FailedLoginIP.objects.get(ip_address=ip_address)
            record.delete()
            self.stdout.write(self.style.SUCCESS(f'✅ IP {ip_address} desbloqueada'))
        except FailedLoginIP.DoesNotExist:
            self.stdout.write(self.style.WARNING(f'⚠️ No se encontró bloqueo para la IP: {ip_address}'))

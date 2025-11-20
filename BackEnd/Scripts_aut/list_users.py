import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from authentication.models import User

print("=" * 60)
print("         USUARIOS EN LA BASE DE DATOS")
print("=" * 60)
print()

users = User.objects.all()

if not users.exists():
    print("No hay usuarios registrados en la base de datos.")
else:
    for u in users:
        print(f"Username:   {u.username}")
        print(f"Role:       {u.role}")
        print(f"Email:      {u.email}")
        print(f"Nombre:     {u.first_name} {u.last_name}")
        print(f"Matrícula:  {u.matricula or 'N/A'}")
        print(f"Carrera:    {u.carrera or 'N/A'}")
        print(f"Activo:     {u.is_active}")
        print(f"Superuser:  {u.is_superuser}")
        print("-" * 60)

print()
print(f"Total de usuarios: {users.count()}")
print()

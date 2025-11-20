import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from requests.models import ECERequest
from authentication.models import User

# Buscar Roberto
try:
    roberto = User.objects.get(username='dr.garcia')
    print(f"✅ Roberto encontrado - ID: {roberto.id}, Nombre: {roberto.get_full_name()}")
except User.DoesNotExist:
    print("❌ Roberto no existe con username 'dr.garcia'")
    # Listar todos los jefes
    jefes = User.objects.filter(role='jefe')
    print("\nJefes disponibles:")
    for j in jefes:
        print(f"  - {j.username} (ID: {j.id}) - {j.get_full_name()}")
    exit()

# Buscar Carlos
carlos = User.objects.get(username='cramirez')
print(f"✅ Carlos encontrado - ID: {carlos.id}, Nombre: {carlos.get_full_name()}")

# Ver solicitudes de Roberto
print(f"\n📊 Solicitudes revisadas por Roberto (ID: {roberto.id}):")
solicitudes_roberto = ECERequest.objects.filter(reviewed_by=roberto)
print(f"   Total: {solicitudes_roberto.count()}")
for s in solicitudes_roberto:
    reviewer_name = s.reviewed_by.get_full_name() if s.reviewed_by else "Sin revisor"
    print(f"   - ID: {s.id} | Estudiante: {s.estudiante.get_full_name()} | Status: {s.status} | Revisor: {reviewer_name}")

# Ver solicitudes de Carlos
print(f"\n📊 Solicitudes revisadas por Carlos (ID: {carlos.id}):")
solicitudes_carlos = ECERequest.objects.filter(reviewed_by=carlos)
print(f"   Total: {solicitudes_carlos.count()}")
for s in solicitudes_carlos:
    reviewer_name = s.reviewed_by.get_full_name() if s.reviewed_by else "Sin revisor"
    print(f"   - ID: {s.id} | Estudiante: {s.estudiante.get_full_name()} | Status: {s.status} | Revisor: {reviewer_name}")

# Ver todas las solicitudes
print(f"\n📋 TODAS las solicitudes en el sistema:")
todas = ECERequest.objects.all()
for s in todas:
    reviewer_name = s.reviewed_by.get_full_name() if s.reviewed_by else "Sin revisor"
    print(f"   - ID: {s.id} | Estudiante: {s.estudiante.get_full_name()} | Status: {s.status} | Revisor: {reviewer_name}")

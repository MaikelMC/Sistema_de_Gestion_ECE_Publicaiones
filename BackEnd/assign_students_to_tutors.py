#!/usr/bin/env python
"""
Script para asignar estudiantes a tutores automáticamente.
Ejecutar: python assign_students_to_tutors.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from authentication.models import User
from publications.models import TutorStudent

def main():
    print("\n=== Asignando Estudiantes a Tutores ===\n")
    
    # Obtener todos los tutores
    tutores = User.objects.filter(role='tutor')
    print(f"Tutores encontrados: {tutores.count()}")
    for t in tutores:
        print(f"  - {t.get_full_name()} (ID: {t.id})")
    
    # Obtener todos los estudiantes
    estudiantes = User.objects.filter(role='estudiante')
    print(f"\nEstudiantes encontrados: {estudiantes.count()}")
    for e in estudiantes:
        print(f"  - {e.get_full_name()} (ID: {e.id})")
    
    if not tutores or not estudiantes:
        print("\n❌ No hay tutores o estudiantes para asignar")
        return
    
    # Asignar estudiantes a tutores (distribuidos)
    print(f"\n=== Asignando Estudiantes ===")
    contador = 0
    
    for i, estudiante in enumerate(estudiantes):
        # Distribuir estudiantes entre tutores (round-robin)
        tutor = tutores[i % len(tutores)]
        
        # Verificar si ya existe la asignación
        if TutorStudent.objects.filter(tutor=tutor, student=estudiante).exists():
            print(f"  ⏭️  {tutor.get_full_name()} → {estudiante.get_full_name()} (ya existe)")
            continue
        
        # Crear asignación
        ts = TutorStudent.objects.create(
            tutor=tutor,
            student=estudiante,
            is_active=True,
            progress=0
        )
        print(f"  ✅ {tutor.get_full_name()} → {estudiante.get_full_name()}")
        contador += 1
    
    print(f"\n✅ Se asignaron {contador} estudiantes nuevos")
    
    # Verificar resultado final
    print(f"\n=== Resultado Final ===")
    for tutor in tutores:
        asignados = TutorStudent.objects.filter(tutor=tutor, is_active=True).count()
        print(f"  {tutor.get_full_name()}: {asignados} estudiantes")

if __name__ == '__main__':
    main()

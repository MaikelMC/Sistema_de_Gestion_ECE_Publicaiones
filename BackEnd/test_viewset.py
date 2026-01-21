#!/usr/bin/env python
import os
import sys
import django
import json
from django.test import RequestFactory
from django.contrib.auth import get_user_model

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from publications.views import StudentOpinionViewSet
from rest_framework.test import APIRequestFactory, force_authenticate

User = get_user_model()

# Get jefe user
jefe_user = User.objects.filter(role='jefe').first()
print(f"\n🔍 Probando endpoint con usuario jefe: {jefe_user}")

# Create request factory
factory = APIRequestFactory()

# Create a GET request to student-opinions list
request = factory.get('/publications/student-opinions/')
force_authenticate(request, user=jefe_user)

# Create viewset instance
viewset = StudentOpinionViewSet()
viewset.request = request
viewset.format_kwarg = None

# Call list method
try:
    response = viewset.list(request)
    print(f"✅ Status Code: {response.status_code}")
    print(f"📊 Data: {response.data}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

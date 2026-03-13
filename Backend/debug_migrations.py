import os
import sys
import django
from django.core.management import execute_from_command_line

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BuildHub.settings')
django.setup()

try:
    execute_from_command_line(['manage.py', 'makemigrations'])
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()

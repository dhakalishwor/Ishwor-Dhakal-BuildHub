import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "BuildHub.settings")
django.setup()

from Authentication.models import User

def create_superadmin(username, email, password):
    if User.objects.filter(username=username).exists():
        print(f"User {username} already exists.")
        return

    admin_user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        role=User.ROLE_ADMIN
    )
    print(f"Superadmin {username} created successfully with role 'admin'.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 4:
        print("Usage: python create_superadmin.py <username> <email> <password>")
    else:
        create_superadmin(sys.argv[1], sys.argv[2], sys.argv[3])

from .models import Notification

def notify(user, title, message="", type="SYSTEM", link=""):
    if not user:
        return None
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=type,
        link=link,
    )
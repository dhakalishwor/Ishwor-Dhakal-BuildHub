from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.db.models import Q

from .models import Report, ModerationProfile


AUTO_FLAG_THRESHOLD = 5  # BONUS


def get_or_create_moderation_profile(user):
    mp, _ = ModerationProfile.objects.get_or_create(user=user)
    return mp


@receiver(post_save, sender=Report)
def auto_flag_user_on_reports(sender, instance: Report, created, **kwargs):
    """
    When a report is created or updated, update reported_user moderation stats.
    """
    if not instance.reported_user:
        return

    target_user = instance.reported_user
    mp = get_or_create_moderation_profile(target_user)

    # Count reports received that are not rejected
    count = Report.objects.filter(
        reported_user=target_user
    ).exclude(status="REJECTED").count()

    mp.reports_count = count

    # Auto-flag logic
    if count >= AUTO_FLAG_THRESHOLD:
        if not mp.is_flagged:
            mp.is_flagged = True
            mp.last_flagged_at = timezone.now()
    else:
        # If you want auto-unflag when count drops (rare), keep this:
        mp.is_flagged = False

    mp.save()
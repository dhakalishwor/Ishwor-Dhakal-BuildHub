import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BuildHub.settings')
django.setup()

print("Attempting to import models...")
try:
    from RecommendationSystem import models as rs_models
    print("Imported RecommendationSystem.models")
    from BiddingSystem import models as bs_models
    print("Imported BiddingSystem.models")
    from payments import models as p_models
    print("Imported payments.models")
    from ProgressTracking import models as pt_models
    print("Imported ProgressTracking.models")
    print("All models imported successfully.")
except Exception as e:
    print(f"IMPORT ERROR: {e}")
    import traceback
    traceback.print_exc()

print("Attempting to import views...")
try:
    from BiddingSystem import views as bs_views
    print("Imported BiddingSystem.views")
    from payments import views as p_views
    print("Imported payments.views")
    from ProgressTracking import views as pt_views
    print("Imported ProgressTracking.views")
    print("All views imported successfully.")
except Exception as e:
    print(f"IMPORT ERROR: {e}")
    import traceback
    traceback.print_exc()

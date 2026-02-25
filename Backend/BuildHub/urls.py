from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("auth/", include("Authentication.urls")),
    path("api/", include("RecommendationSystem.urls")),
    path("api/", include("BiddingSystem.urls")),
    path("api/", include("RatingSystem.urls")),
    path("api/", include("payments.urls")),
    path("api/", include("ContractorManagement.urls")),
    path("api/chat/", include("ChatSystem.urls")),
    path("api/", include("CostEstimation.urls")),
    path("api/", include("IssueSystem.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/swagger/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/docs/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),


]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

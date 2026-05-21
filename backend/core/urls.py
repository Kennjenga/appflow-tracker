from django.contrib import admin
from django.conf import settings
from django.urls import path

from core.api import api


urlpatterns = [
    path("admin/", admin.site.urls),
    path(f"{settings.API_BASE_PATH}/", api.urls),
]

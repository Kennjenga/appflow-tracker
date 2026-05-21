from django.conf import settings
from ninja import NinjaAPI

from apps.applications.api import router as applications_router


api = NinjaAPI(title="AppFlow Tracker API", version=settings.API_VERSION)
api.add_router("/applications", applications_router, tags=["Applications"])

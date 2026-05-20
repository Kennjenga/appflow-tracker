from ninja import NinjaAPI

from apps.applications.api import router as applications_router


api = NinjaAPI(title="AppFlow Tracker API", version="1.0.0")
api.add_router("/applications", applications_router, tags=["Applications"])

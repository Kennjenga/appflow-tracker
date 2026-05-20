from django.contrib import admin
from unfold.admin import ModelAdmin

from apps.applications.models import Application


@admin.register(Application)
class ApplicationAdmin(ModelAdmin):
    """Django Unfold admin optimized for scanning and searching submissions."""

    list_display = (
        "tracking_number",
        "applicant_name",
        "company_name",
        "application_type",
        "status",
        "created_at",
    )
    list_filter = ("status", "application_type", "created_at")
    search_fields = (
        "tracking_number",
        "applicant_name",
        "applicant_email",
        "company_name",
    )
    readonly_fields = (
        "tracking_number",
        "created_at",
        "updated_at",
        "submitted_at",
        "reviewed_at",
    )
    ordering = ("-created_at",)

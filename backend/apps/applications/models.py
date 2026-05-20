import uuid

from django.db import models


class Application(models.Model):
    """Application record plus lifecycle timestamps for the review workflow."""
    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        SUBMITTED = "Submitted", "Submitted"
        UNDER_REVIEW = "Under Review", "Under Review"
        NEED_MORE_INFO = "Need More Information", "Need More Information"
        APPROVED = "Approved", "Approved"
        REJECTED = "Rejected", "Rejected"

    class ApplicationType(models.TextChoices):
        RECORDATION = "Recordation", "Recordation"
        RENEWAL = "Renewal", "Renewal"
        CHANGE_OF_OWNERSHIP = "Change of Ownership", "Change of Ownership"
        CHANGE_OF_NAME = "Change of Name", "Change of Name"
        DISCONTINUATION = "Discontinuation", "Discontinuation"

    tracking_number = models.CharField(max_length=20, unique=True, editable=False)
    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    company_name = models.CharField(max_length=255)
    application_type = models.CharField(max_length=50, choices=ApplicationType.choices)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT, db_index=True)
    reviewer_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = f"APP-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tracking_number} - {self.applicant_name}"

"""Workflow helpers are the single source of truth for status transitions.

API views, tests, and future admin actions should call these functions instead
of changing status fields directly so the assignment rules stay consistent.
"""

from django.utils import timezone
from ninja.errors import HttpError

from apps.applications.models import Application


EDITABLE_STATUSES = {
    Application.Status.DRAFT,
    Application.Status.NEED_MORE_INFO,
}

DECISION_STATUSES = {
    Application.Status.APPROVED,
    Application.Status.REJECTED,
    Application.Status.NEED_MORE_INFO,
}

COMMENT_REQUIRED_DECISIONS = {
    Application.Status.REJECTED,
    Application.Status.NEED_MORE_INFO,
}


def create_application(data: dict) -> Application:
    _validate_application_type(data.get("application_type"))
    return Application.objects.create(**data)


def update_application(application: Application, data: dict) -> Application:
    if application.status not in EDITABLE_STATUSES:
        _bad_request(f"Cannot edit application with status '{application.status}'.")

    if "application_type" in data:
        _validate_application_type(data["application_type"])

    for field, value in data.items():
        setattr(application, field, value)

    application.save()
    return application


def submit_application(application: Application) -> Application:
    if application.status != Application.Status.DRAFT:
        _bad_request("Only Draft applications can be submitted.")

    application.status = Application.Status.SUBMITTED
    application.submitted_at = timezone.now()
    application.save(update_fields=["status", "submitted_at", "updated_at"])
    return application


def resubmit_application(application: Application) -> Application:
    if application.status != Application.Status.NEED_MORE_INFO:
        _bad_request("Only Need More Information applications can be resubmitted.")

    application.status = Application.Status.SUBMITTED
    application.submitted_at = timezone.now()
    application.reviewed_at = None
    application.save(update_fields=["status", "submitted_at", "reviewed_at", "updated_at"])
    return application


def start_review(application: Application) -> Application:
    if application.status != Application.Status.SUBMITTED:
        _bad_request("Only Submitted applications can move to Under Review.")

    application.status = Application.Status.UNDER_REVIEW
    application.save(update_fields=["status", "updated_at"])
    return application


def record_decision(
    application: Application,
    decision: str,
    reviewer_comment: str = "",
) -> Application:
    if application.status != Application.Status.UNDER_REVIEW:
        _bad_request("Only Under Review applications can receive a decision.")

    if decision not in DECISION_STATUSES:
        _bad_request(f"Invalid decision: {decision}.")

    if decision in COMMENT_REQUIRED_DECISIONS and not reviewer_comment.strip():
        _bad_request("A reviewer comment is required for this decision.")

    application.status = decision
    application.reviewer_comment = reviewer_comment.strip()
    application.reviewed_at = timezone.now()
    application.save(update_fields=["status", "reviewer_comment", "reviewed_at", "updated_at"])
    return application


def _validate_application_type(application_type: str | None) -> None:
    valid_types = {choice.value for choice in Application.ApplicationType}
    if application_type not in valid_types:
        _bad_request(f"Invalid application type: {application_type}.")


def _bad_request(message: str) -> None:
    raise HttpError(400, message)

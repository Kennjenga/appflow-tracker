"""Workflow helpers are the single source of truth for application status
transitions and validation.

This module centralizes the rules for creating, updating, submitting and
advancing application objects through the lifecycle. API views, management
commands, and tests should call these functions rather than directly mutating
model fields so transition rules, validation, and timestamps remain consistent
in one place.

Function responsibilities:
- `create_application` - validate and persist a new application record.
- `update_application` - guard editable statuses and apply updates.
- `submit_application` / `resubmit_application` - move drafts or 'need more'
    items into the submitted state and set timestamps accordingly.
- `start_review` / `record_decision` - progress the application through
    review and record reviewer decisions with optional comments.
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
    """Create and persist a new Application.

    Validates the supplied `application_type` and delegates to Django's ORM
    to create the record. Incoming `data` is expected to match model fields
    (e.g. applicant_name, applicant_email, etc.).
    """
    _validate_application_type(data.get("application_type"))
    return Application.objects.create(**data)


def update_application(application: Application, data: dict) -> Application:
    """Apply partial updates to an existing Application.

    Enforces that only applications in editable statuses may be changed.
    Accepts a partial `data` dict (fields to update) and saves the model.
    Raises an HttpError (400) for invalid transitions or types.
    """
    if application.status not in EDITABLE_STATUSES:
        _bad_request(f"Cannot edit application with status '{application.status}'.")

    if "application_type" in data:
        _validate_application_type(data["application_type"])

    for field, value in data.items():
        setattr(application, field, value)

    application.save()
    return application


def submit_application(application: Application) -> Application:
    """Transition a Draft application to Submitted.

    Only allowed when the application is currently in the Draft status. Sets
    the `submitted_at` timestamp and updates the status atomically.
    """
    if application.status != Application.Status.DRAFT:
        _bad_request("Only Draft applications can be submitted.")

    application.status = Application.Status.SUBMITTED
    application.submitted_at = timezone.now()
    application.save(update_fields=["status", "submitted_at", "updated_at"])
    return application


def resubmit_application(application: Application) -> Application:
    """Resubmit an application that previously required more information.

    This moves the application back into the Submitted state and clears
    any previous `reviewed_at` timestamp so review history reflects the
    new submission.
    """
    if application.status != Application.Status.NEED_MORE_INFO:
        _bad_request("Only Need More Information applications can be resubmitted.")

    application.status = Application.Status.SUBMITTED
    application.submitted_at = timezone.now()
    application.reviewed_at = None
    application.save(update_fields=["status", "submitted_at", "reviewed_at", "updated_at"])
    return application


def start_review(application: Application) -> Application:
    """Mark a Submitted application as Under Review.

    Ensures only submitted items enter the review queue.
    """
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
    """Record the outcome of a review.

    Validates that the application is under review and that the provided
    decision is one of the allowed terminal review outcomes. For decisions
    that require a comment (e.g. Rejected, Need More Info) a reviewer
    comment must be supplied.
    """
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
    """Ensure the provided application_type matches an allowed enum value.

    Raises a 400 HttpError when an unknown type is provided.
    """
    valid_types = {choice.value for choice in Application.ApplicationType}
    if application_type not in valid_types:
        _bad_request(f"Invalid application type: {application_type}.")


def _bad_request(message: str) -> None:
    # Helper to raise a Ninja HttpError with a 400 status code and message.
    raise HttpError(400, message)

"""API endpoints for application CRUD and workflow transitions.

This module exposes a thin HTTP layer using Django Ninja. It delegates
business rules and validation to `apps.applications.workflow` so views
remain straightforward and focused on request/response concerns only.
"""

from django.shortcuts import get_object_or_404
from ninja import Router, Status

from apps.applications import workflow
from apps.applications.models import Application
from apps.applications.schemas import (
    ApplicationCreateIn,
    ApplicationOut,
    ApplicationUpdateIn,
    ReviewDecisionIn,
)


router = Router()


@router.post("/", response={201: ApplicationOut})
def create_application(request, payload: ApplicationCreateIn):
    """Create a new application record.

    Payload validation is performed by the Pydantic/Ninja schema. Business
    validation and persistence are handled by `workflow.create_application`.
    """
    return Status(201, workflow.create_application(payload.dict()))


@router.get("/", response=list[ApplicationOut])
def list_applications(request):
    """Return a list of all applications.

    Pagination could be added here in the future; for now we return all
    records to keep the API simple for the UI and tests.
    """
    return Application.objects.all()


@router.get("/{application_id}/", response=ApplicationOut)
def get_application(request, application_id: int):
    """Retrieve a single application by id or return 404."""
    return get_object_or_404(Application, id=application_id)


@router.patch("/{application_id}/", response=ApplicationOut)
def update_application(request, application_id: int, payload: ApplicationUpdateIn):
    """Apply partial updates to an application.

    Uses `workflow.update_application` to enforce editable statuses and
    validate fields.
    """
    application = get_object_or_404(Application, id=application_id)
    return workflow.update_application(application, payload.dict(exclude_none=True))


@router.post("/{application_id}/submit/", response=ApplicationOut)
def submit_application(request, application_id: int):
    """Transition a draft application to submitted."""
    application = get_object_or_404(Application, id=application_id)
    return workflow.submit_application(application)


@router.post("/{application_id}/resubmit/", response=ApplicationOut)
def resubmit_application(request, application_id: int):
    """Resubmit an application that required more information."""
    application = get_object_or_404(Application, id=application_id)
    return workflow.resubmit_application(application)


@router.post("/{application_id}/start-review/", response=ApplicationOut)
def start_review(request, application_id: int):
    """Move a submitted application to the review queue."""
    application = get_object_or_404(Application, id=application_id)
    return workflow.start_review(application)


@router.post("/{application_id}/decision/", response=ApplicationOut)
def record_decision(request, application_id: int, payload: ReviewDecisionIn):
    """Record the review decision and optional reviewer comment."""
    application = get_object_or_404(Application, id=application_id)
    return workflow.record_decision(
        application,
        decision=payload.decision,
        reviewer_comment=payload.reviewer_comment,
    )

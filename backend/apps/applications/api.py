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
    return Status(201, workflow.create_application(payload.dict()))


@router.get("/", response=list[ApplicationOut])
def list_applications(request):
    return Application.objects.all()


@router.get("/{application_id}/", response=ApplicationOut)
def get_application(request, application_id: int):
    return get_object_or_404(Application, id=application_id)


@router.patch("/{application_id}/", response=ApplicationOut)
def update_application(request, application_id: int, payload: ApplicationUpdateIn):
    application = get_object_or_404(Application, id=application_id)
    return workflow.update_application(application, payload.dict(exclude_none=True))


@router.post("/{application_id}/submit/", response=ApplicationOut)
def submit_application(request, application_id: int):
    application = get_object_or_404(Application, id=application_id)
    return workflow.submit_application(application)


@router.post("/{application_id}/resubmit/", response=ApplicationOut)
def resubmit_application(request, application_id: int):
    application = get_object_or_404(Application, id=application_id)
    return workflow.resubmit_application(application)


@router.post("/{application_id}/start-review/", response=ApplicationOut)
def start_review(request, application_id: int):
    application = get_object_or_404(Application, id=application_id)
    return workflow.start_review(application)


@router.post("/{application_id}/decision/", response=ApplicationOut)
def record_decision(request, application_id: int, payload: ReviewDecisionIn):
    application = get_object_or_404(Application, id=application_id)
    return workflow.record_decision(
        application,
        decision=payload.decision,
        reviewer_comment=payload.reviewer_comment,
    )

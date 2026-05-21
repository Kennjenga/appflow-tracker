import pytest
from django.test import Client
from django.utils import timezone
from ninja.testing import TestClient

from apps.applications.api import router
from apps.applications.models import Application


pytestmark = pytest.mark.django_db

client = TestClient(router)
django_client = Client()


def payload(**overrides):
    data = {
        "applicant_name": "Ada Lovelace",
        "applicant_email": "ada@example.com",
        "company_name": "Analytical Engines Ltd",
        "application_type": Application.ApplicationType.RECORDATION,
        "description": "Record a new product.",
    }
    data.update(overrides)
    return data


def test_create_application_defaults_to_draft():
    response = client.post("/", json=payload())

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == Application.Status.DRAFT
    assert body["tracking_number"].startswith("APP-")


def test_versioned_api_prefix_is_available():
    response = django_client.get("/api/v1/applications/")

    assert response.status_code == 200


def test_update_rejects_non_editable_status():
    application = Application.objects.create(
        **payload(),
        status=Application.Status.SUBMITTED,
        submitted_at=timezone.now(),
    )

    response = client.patch(f"/{application.id}/", json={"company_name": "New Name"})

    assert response.status_code == 400
    assert "Cannot edit" in response.json()["detail"]


def test_happy_path_to_approval():
    application = Application.objects.create(**payload())

    submit_response = client.post(f"/{application.id}/submit/")
    review_response = client.post(f"/{application.id}/start-review/")
    decision_response = client.post(
        f"/{application.id}/decision/",
        json={"decision": Application.Status.APPROVED, "reviewer_comment": ""},
    )

    assert submit_response.status_code == 200
    assert review_response.status_code == 200
    assert decision_response.status_code == 200
    assert decision_response.json()["status"] == Application.Status.APPROVED


def test_rejected_decision_requires_comment():
    application = Application.objects.create(**payload(), status=Application.Status.UNDER_REVIEW)

    response = client.post(
        f"/{application.id}/decision/",
        json={"decision": Application.Status.REJECTED, "reviewer_comment": "   "},
    )

    assert response.status_code == 400
    assert "comment is required" in response.json()["detail"]

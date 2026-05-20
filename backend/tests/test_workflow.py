import pytest
from ninja.errors import HttpError

from apps.applications import workflow
from apps.applications.models import Application


pytestmark = pytest.mark.django_db


def make_application(**overrides):
    data = {
        "applicant_name": "Grace Hopper",
        "applicant_email": "grace@example.com",
        "company_name": "Compiler Co",
        "application_type": Application.ApplicationType.RENEWAL,
        "description": "",
    }
    data.update(overrides)
    return Application.objects.create(**data)


def test_need_more_information_can_be_edited_and_resubmitted():
    application = make_application(status=Application.Status.NEED_MORE_INFO)

    workflow.update_application(application, {"description": "Extra details"})
    workflow.resubmit_application(application)

    application.refresh_from_db()
    assert application.description == "Extra details"
    assert application.status == Application.Status.SUBMITTED
    assert application.submitted_at is not None


def test_invalid_transition_raises_400():
    application = make_application(status=Application.Status.APPROVED)

    with pytest.raises(HttpError) as error:
        workflow.start_review(application)

    assert error.value.status_code == 400

# AppFlow Tracker

Mini application workflow tracker built for the Django/React take-home assignment.

## Project Author

- Name: Kenneth Njenga
- Email: kinyagia2@gmail.com

The workflow is:

```text
Draft -> Submitted -> Under Review -> Need More Information / Approved / Rejected
Need More Information -> Submitted
```

## Stack

- Backend: Django, Django Ninja, Django Unfold, SQLite
- Frontend: Vite, React, TanStack Router, TanStack Query, TanStack Table, Axios
- Tests: pytest for backend workflow/API behavior, Vitest + Testing Library for frontend helpers/components

## Project Structure

```text
backend/
  apps/applications/   Application model, API schemas, workflow rules, admin
  core/                Django settings, URLs, Ninja API registration
frontend/
  src/api/             Axios API client
  src/components/      Shared UI components
  src/pages/           List, form, and detail screens
  src/utils/           Workflow and validation helpers
```

## Backend Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate

@"
SECRET_KEY=change-me-for-non-local-use
DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
"@ | Set-Content .env

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Useful URLs:

- API docs: `http://localhost:8000/api/docs`
- Django Unfold admin: `http://localhost:8000/admin/`

The backend includes `backend/.env.example` with the local settings that would be externalized for non-local use, including `SECRET_KEY=change-me-for-non-local-use`. To generate a new secret key with Node.js, run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. The current assignment implementation keeps settings simple and source-readable.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and calls `http://localhost:8000/api` by default.

To override the API base URL, create `frontend/.env`:

```text
VITE_API_BASE_URL=http://localhost:8000/api
```

## API Examples

Create a draft:

```bash
curl -X POST http://localhost:8000/api/applications/ ^
  -H "Content-Type: application/json" ^
  -d "{\"applicant_name\":\"Jane Doe\",\"applicant_email\":\"jane@example.com\",\"company_name\":\"Acme Ltd\",\"application_type\":\"Recordation\",\"description\":\"Initial filing\"}"
```

Submit a draft:

```bash
curl -X POST http://localhost:8000/api/applications/1/submit/
```

Start review:

```bash
curl -X POST http://localhost:8000/api/applications/1/start-review/
```

Record a reviewer decision:

```bash
curl -X POST http://localhost:8000/api/applications/1/decision/ ^
  -H "Content-Type: application/json" ^
  -d "{\"decision\":\"Need More Information\",\"reviewer_comment\":\"Please upload the missing ownership document.\"}"
```

## Workflow Rules

- Only `Draft` applications can be submitted.
- Only `Submitted` applications can move to `Under Review`.
- Only `Under Review` applications can receive reviewer decisions.
- `Draft` and `Need More Information` applications can be edited.
- `Approved` and `Rejected` applications cannot be edited.
- `Need More Information` applications can be edited and resubmitted.
- Reviewer comments are required for `Need More Information` and `Rejected`.

Backend workflow rules live in `backend/apps/applications/workflow.py`. Frontend action visibility mirrors those rules in `frontend/src/utils/workflow.js`, but the backend remains authoritative.

## Tests

Backend:

```bash
cd backend
venv\Scripts\activate
python -m pytest
python manage.py check
```

Frontend:

```bash
cd frontend
npm run test
npm run build
```

## Assumptions

- No authentication or role separation is included.
- Any user can create, edit eligible drafts, and perform reviewer actions.
- SQLite is used for simple local setup.
- Tracking numbers are generated automatically as `APP-{8 hex chars}`.
- The frontend uses TanStack Router for page routing, TanStack Query for server state, and TanStack Table for the list.

## With More Time

- Add applicant/reviewer authentication and role-based permissions.
- Add pagination, filters, and server-side search to the list endpoint.
- Add an audit log for workflow transitions.
- Add Docker Compose with Postgres.
- Add richer form validation and toast notifications.
- Add deployment-ready environment configuration.
- Add CI/CD workflows.

# AppFlow Tracker - Backend

Django API powering the AppFlow Tracker workflow management system.

## Tech Stack

- Python / Django
- Django Ninja for API endpoints
- Django Unfold for the admin UI
- SQLite for local development
- pytest for testing

## Project Structure

```text
backend/
├── apps/
│   └── applications/     Application model, API schemas, workflow rules, admin
├── core/                 Django settings, URLs, and Ninja API registration
├── .env.example          Environment variable reference
├── manage.py
└── requirements.txt
```

## Screenshots

### Admin Dashboard

<img src="../docs/images/appflow%20admin%20dashboard.png" alt="AppFlow Tracker Admin Dashboard" width="1200">

### API Documentation

<img src="../docs/images/appflow%20apis.png" alt="AppFlow Tracker API Documentation" width="1200">

## Setup

### 1. Create and activate a virtual environment

```powershell
# Create and activate a virtual environment for local development.
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Configure environment variables

Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=change-me-for-non-local-use
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

To generate a new secret key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Install dependencies

```bash
# Install backend dependencies.
pip install -r requirements.txt
```

### 4. Run migrations and create a superuser

```bash
# Apply the database schema changes.
python manage.py migrate
# Create a superuser for the admin dashboard.
python manage.py createsuperuser
```

### 5. Start the development server

```bash
# Start the Django development server.
python manage.py runserver
```

## Useful URLs

| URL | Description |
|---|---|
| `http://localhost:8000/api/v1/docs` | Interactive API documentation |
| `http://localhost:8000/admin/` | Django Unfold admin dashboard |

## Running Tests

```powershell
python -m pytest
python manage.py check
```

## Workflow Rules

Transitions follow this state machine:

```text
Draft -> Submitted -> Under Review -> Approved
                         -> Rejected
                         -> Need More Information -> Submitted
```

Rules enforced in `apps/applications/workflow.py`:

- Only `Draft` applications can be submitted.
- Only `Submitted` applications can move to `Under Review`.
- Only `Under Review` applications can receive a reviewer decision.
- `Draft` and `Need More Information` applications can be edited.
- `Approved` and `Rejected` applications are locked.
- Reviewer comments are required for `Need More Information` and `Rejected`.

## API Examples

### Create a draft

```bash
curl -X POST http://localhost:8000/api/v1/applications/ ^
  -H "Content-Type: application/json" ^
  -d "{\"applicant_name\":\"Jane Doe\",\"applicant_email\":\"jane@example.com\",\"company_name\":\"Acme Ltd\",\"application_type\":\"Recordation\",\"description\":\"Initial filing\"}"
```

### Submit a draft

```bash
curl -X POST http://localhost:8000/api/v1/applications/1/submit/
```

### Start review

```bash
curl -X POST http://localhost:8000/api/v1/applications/1/start-review/
```

### Record a reviewer decision

```bash
curl -X POST http://localhost:8000/api/v1/applications/1/decision/ ^
  -H "Content-Type: application/json" ^
  -d "{\"decision\":\"Need More Information\",\"reviewer_comment\":\"Please upload the missing ownership document.\"}"
```

## Notes

- No authentication is implemented; all users can perform all actions.
- Tracking numbers are auto-generated as `APP-{8 hex chars}`.
- SQLite is used for simplicity; swap for Postgres in production.
- The backend includes `.env.example` with the local settings that can be externalized for non-local use.
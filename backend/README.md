# Backend

Django backend for AppFlow Tracker.

## Screenshots

### Admin Dashboard

<img src="../docs/images/appflow%20admin%20dashboard.png" alt="AppFlow Tracker Admin Dashboard" width="1200">

### API Documentation

<img src="../docs/images/appflow%20apis.png" alt="AppFlow Tracker API Documentation" width="1200">

## Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
@"
SECRET_KEY=change-me-for-non-local-use
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
"@ | Set-Content .env
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Secret Key

To generate a new Django secret key with Node.js, run:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The backend includes [.env.example](.env.example) with the local settings that should be externalized for non-local use.

## Useful URLs

- API docs: http://localhost:8000/api/v1/docs
- Django admin: http://localhost:8000/admin/
- Django debug: set `DEBUG=True` in `.env` for local development.

## Tests

```powershell
python -m pytest
python manage.py check
```

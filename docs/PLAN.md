# appflow-tracker — Build Plan

> Take-home assignment: Mini Application Workflow Tracker  
> Stack: Django + Django Ninja (backend) · React + TanStack (frontend) just running tests workflow


---

## Repo name

**`appflow-tracker`**

---

## Workflow states (reference)

```
Draft → Submitted → Under Review → Need More Information / Approved / Rejected
                                        ↓ (resubmit)
                                    Submitted
```

| State | Allowed actions |
|---|---|
| Draft | Edit, Submit |
| Submitted | Start Review |
| Under Review | Approve, Need More Info, Reject |
| Need More Information | Edit, Resubmit |
| Approved | None |
| Rejected | None |

---

## Folder structure

```
appflow-tracker/
├── backend/
│   ├── apps/
│   │   └── applications/
│   │       ├── __init__.py
│   │       ├── models.py
│   │       ├── schemas.py
│   │       ├── api.py
│   │       └── migrations/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── api.py
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── applications.js
    │   ├── components/
    │   │   ├── StatusBadge.jsx
    │   │   └── ReviewDecisionModal.jsx
    │   ├── pages/
    │   │   ├── ApplicationListPage.jsx
    │   │   ├── ApplicationFormPage.jsx
    │   │   └── ApplicationDetailPage.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Phase 1 — Backend (~1.5 hrs)

### Setup

```bash
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install django django-ninja django-cors-headers
django-admin startproject core .
python manage.py startapp applications
mv applications apps/applications
```

`requirements.txt`:
```
django>=4.2
django-ninja>=1.0
django-cors-headers>=4.0
```

### `apps/applications/models.py`

```python
import uuid
from django.db import models


class Application(models.Model):

    class Status(models.TextChoices):
        DRAFT = "Draft"
        SUBMITTED = "Submitted"
        UNDER_REVIEW = "Under Review"
        NEED_MORE_INFO = "Need More Information"
        APPROVED = "Approved"
        REJECTED = "Rejected"

    class ApplicationType(models.TextChoices):
        RECORDATION = "Recordation"
        RENEWAL = "Renewal"
        CHANGE_OF_OWNERSHIP = "Change of Ownership"
        CHANGE_OF_NAME = "Change of Name"
        DISCONTINUATION = "Discontinuation"

    tracking_number = models.CharField(max_length=20, unique=True, editable=False)
    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    company_name = models.CharField(max_length=255)
    application_type = models.CharField(max_length=50, choices=ApplicationType.choices)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.DRAFT)
    reviewer_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = f"APP-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.tracking_number
```

### `apps/applications/schemas.py`

```python
from datetime import datetime
from typing import Optional
from ninja import Schema


class ApplicationCreateIn(Schema):
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    description: str = ""


class ApplicationUpdateIn(Schema):
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    company_name: Optional[str] = None
    application_type: Optional[str] = None
    description: Optional[str] = None


class ReviewDecisionIn(Schema):
    decision: str  # "Approved" | "Rejected" | "Need More Information"
    reviewer_comment: str = ""


class ApplicationOut(Schema):
    id: int
    tracking_number: str
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    description: str
    status: str
    reviewer_comment: str
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
```

### `apps/applications/api.py`

```python
from django.utils import timezone
from ninja import Router
from .models import Application
from .schemas import ApplicationCreateIn, ApplicationUpdateIn, ReviewDecisionIn, ApplicationOut

router = Router()

EDITABLE_STATUSES = {Application.Status.DRAFT, Application.Status.NEED_MORE_INFO}
DECISION_STATUSES = {"Approved", "Rejected", "Need More Information"}


@router.post("/", response=ApplicationOut)
def create_application(request, payload: ApplicationCreateIn):
    return Application.objects.create(**payload.dict())


@router.get("/", response=list[ApplicationOut])
def list_applications(request):
    return Application.objects.all().order_by("-created_at")


@router.get("/{id}/", response=ApplicationOut)
def get_application(request, id: int):
    return Application.objects.get(id=id)


@router.patch("/{id}/", response=ApplicationOut)
def update_application(request, id: int, payload: ApplicationUpdateIn):
    app = Application.objects.get(id=id)
    if app.status not in EDITABLE_STATUSES:
        raise ValueError(f"Cannot edit application with status '{app.status}'")
    for key, value in payload.dict(exclude_none=True).items():
        setattr(app, key, value)
    app.save()
    return app


@router.post("/{id}/submit/", response=ApplicationOut)
def submit_application(request, id: int):
    app = Application.objects.get(id=id)
    if app.status != Application.Status.DRAFT:
        raise ValueError("Only Draft applications can be submitted")
    app.status = Application.Status.SUBMITTED
    app.submitted_at = timezone.now()
    app.save()
    return app


@router.post("/{id}/resubmit/", response=ApplicationOut)
def resubmit_application(request, id: int):
    app = Application.objects.get(id=id)
    if app.status != Application.Status.NEED_MORE_INFO:
        raise ValueError("Only 'Need More Information' applications can be resubmitted")
    app.status = Application.Status.SUBMITTED
    app.submitted_at = timezone.now()
    app.save()
    return app


@router.post("/{id}/start-review/", response=ApplicationOut)
def start_review(request, id: int):
    app = Application.objects.get(id=id)
    if app.status != Application.Status.SUBMITTED:
        raise ValueError("Only Submitted applications can move to Under Review")
    app.status = Application.Status.UNDER_REVIEW
    app.save()
    return app


@router.post("/{id}/decision/", response=ApplicationOut)
def record_decision(request, id: int, payload: ReviewDecisionIn):
    app = Application.objects.get(id=id)
    if app.status != Application.Status.UNDER_REVIEW:
        raise ValueError("Only Under Review applications can receive a decision")
    if payload.decision not in DECISION_STATUSES:
        raise ValueError(f"Invalid decision: {payload.decision}")
    if payload.decision in {"Rejected", "Need More Information"} and not payload.reviewer_comment.strip():
        raise ValueError("A comment is required for Rejected and Need More Information decisions")
    app.status = payload.decision
    app.reviewer_comment = payload.reviewer_comment
    app.reviewed_at = timezone.now()
    app.save()
    return app
```

### `core/api.py`

```python
from ninja import NinjaAPI
from apps.applications.api import router

api = NinjaAPI(title="AppFlow Tracker API")
api.add_router("/applications", router)
```

### `core/urls.py`

```python
from django.contrib import admin
from django.urls import path
from core.api import api

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
```

### `core/settings.py` additions

```python
INSTALLED_APPS = [
    ...
    "corsheaders",
    "ninja",
    "apps.applications",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
```

### Run migrations

```bash
python manage.py makemigrations applications
python manage.py migrate
python manage.py runserver
```

API docs available at: `http://localhost:8000/api/docs`

---

## Phase 2 — Frontend (~2 hrs)

### Setup

```bash
cd frontend
npm create vite@latest . -- --template react
npm install axios react-router-dom
npm install @tanstack/react-query @tanstack/react-table
npm install @tanstack/react-router   # optional — or use react-router-dom v6
```

### TanStack libraries in use

| Library | Purpose |
|---|---|
| `@tanstack/react-query` | Server state — fetching, caching, mutations |
| `@tanstack/react-table` | Application list table with sorting/filtering |
| `react-router-dom` v6 | Routing between pages |

### `src/api/applications.js`

```js
import axios from "axios";

const BASE = "http://localhost:8000/api/applications";

export const api = {
  list: () => axios.get(`${BASE}/`).then(r => r.data),
  get: (id) => axios.get(`${BASE}/${id}/`).then(r => r.data),
  create: (data) => axios.post(`${BASE}/`, data).then(r => r.data),
  update: (id, data) => axios.patch(`${BASE}/${id}/`, data).then(r => r.data),
  submit: (id) => axios.post(`${BASE}/${id}/submit/`).then(r => r.data),
  resubmit: (id) => axios.post(`${BASE}/${id}/resubmit/`).then(r => r.data),
  startReview: (id) => axios.post(`${BASE}/${id}/start-review/`).then(r => r.data),
  decision: (id, data) => axios.post(`${BASE}/${id}/decision/`, data).then(r => r.data),
};
```

### `src/main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);
```

### `src/App.jsx`

```jsx
import { Routes, Route } from "react-router-dom";
import ApplicationListPage from "./pages/ApplicationListPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ApplicationListPage />} />
      <Route path="/applications/new" element={<ApplicationFormPage />} />
      <Route path="/applications/:id/edit" element={<ApplicationFormPage />} />
      <Route path="/applications/:id" element={<ApplicationDetailPage />} />
    </Routes>
  );
}
```

### `src/pages/ApplicationListPage.jsx` (TanStack Table)

```jsx
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { api } from "../api/applications";

const columns = [
  { accessorKey: "tracking_number", header: "Tracking #" },
  { accessorKey: "applicant_name", header: "Applicant" },
  { accessorKey: "company_name", header: "Company" },
  { accessorKey: "application_type", header: "Type" },
  { accessorKey: "status", header: "Status" },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  },
];

export default function ApplicationListPage() {
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: api.list,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <button onClick={() => navigate("/applications/new")}>New Application</button>
      <table>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} onClick={() => navigate(`/applications/${row.original.id}`)}
                style={{ cursor: "pointer" }}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### `src/pages/ApplicationFormPage.jsx`

```jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/applications";

const APPLICATION_TYPES = [
  "Recordation", "Renewal", "Change of Ownership", "Change of Name", "Discontinuation"
];

export default function ApplicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: existing } = useQuery({
    queryKey: ["application", id],
    queryFn: () => api.get(id),
    enabled: isEdit,
  });

  const [form, setForm] = useState({
    applicant_name: "", applicant_email: "", company_name: "",
    application_type: "", description: "",
  });

  useEffect(() => {
    if (existing) setForm({
      applicant_name: existing.applicant_name,
      applicant_email: existing.applicant_email,
      company_name: existing.company_name,
      application_type: existing.application_type,
      description: existing.description,
    });
  }, [existing]);

  const mutation = useMutation({
    mutationFn: isEdit ? (data) => api.update(id, data) : api.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      navigate(`/applications/${data.id}`);
    },
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); mutation.mutate(form); };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isEdit ? "Edit Application" : "New Application"}</h2>
      <input name="applicant_name" value={form.applicant_name} onChange={handleChange}
             placeholder="Applicant name" required />
      <input name="applicant_email" value={form.applicant_email} onChange={handleChange}
             placeholder="Email" type="email" required />
      <input name="company_name" value={form.company_name} onChange={handleChange}
             placeholder="Company name" required />
      <select name="application_type" value={form.application_type} onChange={handleChange} required>
        <option value="">Select type…</option>
        {APPLICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Description" />
      <button type="submit">{isEdit ? "Save" : "Create Draft"}</button>
    </form>
  );
}
```

### `src/pages/ApplicationDetailPage.jsx`

```jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/applications";
import ReviewDecisionModal from "../components/ReviewDecisionModal";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDecision, setShowDecision] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: () => api.get(id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["application", id] });

  const submitMutation = useMutation({ mutationFn: () => api.submit(id), onSuccess: invalidate });
  const resubmitMutation = useMutation({ mutationFn: () => api.resubmit(id), onSuccess: invalidate });
  const startReviewMutation = useMutation({ mutationFn: () => api.startReview(id), onSuccess: invalidate });

  if (isLoading || !app) return <p>Loading…</p>;

  return (
    <div>
      <h2>{app.tracking_number}</h2>
      <p><strong>Status:</strong> {app.status}</p>
      <p><strong>Applicant:</strong> {app.applicant_name} ({app.applicant_email})</p>
      <p><strong>Company:</strong> {app.company_name}</p>
      <p><strong>Type:</strong> {app.application_type}</p>
      <p><strong>Description:</strong> {app.description}</p>
      {app.reviewer_comment && <p><strong>Reviewer comment:</strong> {app.reviewer_comment}</p>}

      {/* Actions by status */}
      {app.status === "Draft" && (
        <>
          <button onClick={() => navigate(`/applications/${id}/edit`)}>Edit</button>
          <button onClick={() => submitMutation.mutate()}>Submit</button>
        </>
      )}
      {app.status === "Submitted" && (
        <button onClick={() => startReviewMutation.mutate()}>Start Review</button>
      )}
      {app.status === "Under Review" && (
        <button onClick={() => setShowDecision(true)}>Record Decision</button>
      )}
      {app.status === "Need More Information" && (
        <>
          <button onClick={() => navigate(`/applications/${id}/edit`)}>Edit</button>
          <button onClick={() => resubmitMutation.mutate()}>Resubmit</button>
        </>
      )}

      {showDecision && (
        <ReviewDecisionModal
          id={id}
          onClose={() => setShowDecision(false)}
          onSuccess={invalidate}
        />
      )}
    </div>
  );
}
```

### `src/components/ReviewDecisionModal.jsx`

```jsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../api/applications";

const COMMENT_REQUIRED = ["Rejected", "Need More Information"];

export default function ReviewDecisionModal({ id, onClose, onSuccess }) {
  const [decision, setDecision] = useState("Approved");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => api.decision(id, { decision, reviewer_comment: comment }),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (COMMENT_REQUIRED.includes(decision) && !comment.trim()) {
      setError("A comment is required for this decision.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={handleSubmit} style={{ background: "white", padding: 24, borderRadius: 8 }}>
        <h3>Record Decision</h3>
        <select value={decision} onChange={e => setDecision(e.target.value)}>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Need More Information</option>
        </select>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={COMMENT_REQUIRED.includes(decision) ? "Comment required" : "Optional comment"}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Submit</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}
```

---

## Phase 3 — README (~30 min)

Your project README should cover:

- How to run the backend (virtualenv, pip install, migrate, runserver)
- How to run the frontend (npm install, npm run dev)
- API docs URL (`http://localhost:8000/api/docs`)
- Assumptions made (no auth, SQLite, tracking number auto-generated, comment required for NMI/Reject)
- What you'd improve with more time (see below)

### Assumptions to state

- No authentication — any user can perform any action
- SQLite used for simplicity; swap to Postgres in production
- Tracking numbers are auto-generated as `APP-{8 hex chars}`
- Reviewer comment is validated as required on both frontend and backend for Rejected and NMI decisions

### What to improve with more time

- Add JWT authentication and role separation (applicant vs reviewer)
- Pagination and filtering on the list endpoint
- Unit tests for workflow rules (pytest + ninja test client)
- React Query DevTools for debugging
- Form validation with `react-hook-form` + Zod
- Toast notifications for mutation feedback
- Proper error boundary and 404 handling
- Deploy with Docker Compose

---

## Key decisions summary

| Decision | Rationale |
|---|---|
| No auth | Out of scope for this assignment; noted as improvement |
| SQLite | Default Django DB, zero config needed |
| TanStack Query | Handles caching, loading states, invalidation cleanly |
| TanStack Table | Handles column sorting/filtering with minimal code |
| Comment validation on backend | Frontend validation alone is not trustworthy |
| Separate resubmit endpoint | Cleaner than overloading the submit endpoint with status checks |

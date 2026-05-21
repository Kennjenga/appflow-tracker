# AppFlow Tracker - Frontend

React SPA for managing and tracking application workflows.

## Tech Stack

- Vite + React with TypeScript
- TanStack Router for page routing
- TanStack Query for server state and data fetching
- TanStack Table for the application list
- Axios for HTTP requests
- Vitest + Testing Library for unit tests

## Project Structure

```text
frontend/
├── src/
│   ├── api/           Axios API client and request functions
│   ├── components/    Shared UI components
│   ├── pages/         List, form, and detail screens
│   └── utils/         Workflow helpers and validation logic
├── public/
├── index.html
├── package.json
└── vite.config.ts
```

## Screenshots

### Dashboard

<img src="../docs/images/appflow%20dashboard.png" alt="AppFlow Tracker Dashboard" width="1200">

### Create Application

<img src="../docs/images/appflow%20create.png" alt="AppFlow Tracker Create Application" width="1200">

## Setup

### 1. Install dependencies

```bash
# Install frontend dependencies.
cd frontend
npm install
```

### 2. Configure environment (optional)

By default, the app calls `http://localhost:8000/api/v1`. To override it, create a `.env` file in `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Start the development server

```bash
# Start the Vite development server.
npm run dev
```

The app runs at `http://localhost:5173`.

> Make sure the backend server is running first at `http://localhost:8000`.

## Running Tests

```bash
npm run test
```

Tests cover workflow helper functions and key UI components using Vitest and Testing Library.

## Notes

- Frontend workflow visibility in `src/utils/workflow.ts` mirrors backend rules, but the backend is authoritative.
- No authentication layer is included.
- The form flow is intentionally submit-first; draft saving is not exposed in the UI.
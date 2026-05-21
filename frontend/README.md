# AppFlow Tracker Frontend

React frontend for the mini application workflow tracker.

## Screenshots

### Dashboard

<img src="../docs/images/appflow%20dashboard.png" alt="AppFlow Tracker Dashboard" width="1200">

### Create Application

<img src="../docs/images/appflow%20create.png" alt="AppFlow Tracker Create Application" width="1200">

## Stack

- Vite + React
- TanStack Router for page routing
- TanStack Query for server state
- TanStack Table for the application list
- Axios for API calls
- Vitest + Testing Library for focused component and utility tests

## Run

```bash
npm install
npm run dev
```

The app expects the API at `http://localhost:8000/api/v1` by default. Override it with:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
```

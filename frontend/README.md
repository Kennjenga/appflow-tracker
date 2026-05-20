# AppFlow Tracker Frontend

React frontend for the mini application workflow tracker.

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

The app expects the API at `http://localhost:8000/api` by default. Override it with:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
```

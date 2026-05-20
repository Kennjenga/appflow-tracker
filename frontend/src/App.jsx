import {
  Outlet,
  Navigate,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import './App.css'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import ApplicationFormPage from './pages/ApplicationFormPage'
import ApplicationListPage from './pages/ApplicationListPage'

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: () => <Navigate to="/" replace />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ApplicationListPage,
})

const newApplicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/applications/new',
  component: ApplicationFormPage,
})

const applicationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/applications/$id',
  component: ApplicationDetailPage,
})

const applicationEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/applications/$id/edit',
  component: ApplicationFormPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  newApplicationRoute,
  applicationDetailRoute,
  applicationEditRoute,
])

const router = createRouter({ routeTree })

export default function App() {
  return <RouterProvider router={router} />
}

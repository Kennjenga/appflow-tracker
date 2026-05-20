import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import './App.css'
import Layout from './components/Layout'
import ApplicationDetailPage from './pages/ApplicationDetailPage'
import ApplicationFormPage from './pages/ApplicationFormPage'
import ApplicationListPage from './pages/ApplicationListPage'

function RootComponent() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

const rootRoute = createRootRoute({
  component: RootComponent,
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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Login from './pages/Login'
import Layout from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ROUTE_ROLES } from './utils/roles'

import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import POS from './pages/POS'
import Suppliers from './pages/Suppliers'
import Customers from './pages/Customers'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Users from './pages/Users'

const PAGES = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/products', element: <Products /> },
  { path: '/pos', element: <POS /> },
  { path: '/suppliers', element: <Suppliers /> },
  { path: '/customers', element: <Customers /> },
  { path: '/purchases', element: <Purchases /> },
  { path: '/reports', element: <Reports /> },
  { path: '/settings', element: <Settings /> },
  { path: '/users', element: <Users /> },
]

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {PAGES.map(({ path, element }) => (
            <Route key={path} path={path} element={
              <ProtectedRoute roles={ROUTE_ROLES[path]}>
                <Layout>
                  {element}
                </Layout>
              </ProtectedRoute>
            } />
          ))}

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Login from './pages/Login'
import Layout from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import POS from './pages/POS'
import Suppliers from './pages/Suppliers'
import Customers from './pages/Customers'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/products" element={
            <ProtectedRoute>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/pos" element={
            <ProtectedRoute>
              <Layout>
                <POS />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/suppliers" element={
            <ProtectedRoute>
              <Layout>
                <Suppliers />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/customers" element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          } />

           <Route path="/purchases" element={
            <ProtectedRoute>
              <Layout>
                <Purchases />
              </Layout>
            </ProtectedRoute>
          } />

           <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />

           <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

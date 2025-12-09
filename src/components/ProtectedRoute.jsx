import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const ProtectedRoute = ({ children }) => {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    // Redirect to login with the current location as the redirect target
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
    return <Navigate to={redirectUrl} replace />
  }

  return children
}

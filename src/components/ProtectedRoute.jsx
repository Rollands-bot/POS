import { Navigate, useLocation } from 'react-router-dom'
import { Loader2, ShieldAlert, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getHomePath, isValidRole } from '../utils/roles'

export const ProtectedRoute = ({ children, roles }) => {
  const { session, profile, profileLoading, profileError, signOut } = useAuth()
  const location = useLocation()

  if (!session) {
    // Redirect to login with the current location as the redirect target
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
    return <Navigate to={redirectUrl} replace />
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-yellow-400" size={40} />
      </div>
    )
  }

  if (!isValidRole(profile?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <ShieldAlert className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Akun Belum Punya Akses</h2>
          <p className="text-gray-500 text-sm mb-1">
            Akun <span className="font-medium text-gray-700">{session.user.email}</span> belum memiliki role.
          </p>
          <p className="text-gray-500 text-sm mb-6">Hubungi admin untuk mengatur role akun ini.</p>
          {profileError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl p-3 mb-6 break-words">{profileError}</p>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-yellow-400/20"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to={getHomePath(profile.role)} replace />
  }

  return children
}

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route — redirects to /login if no valid session.
 * Shows nothing while auth state is still loading.
 */
function ProtectedRoute({ children }) {
  const { team, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-deep)]">
        <svg className="h-8 w-8 animate-spin text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  if (!team) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

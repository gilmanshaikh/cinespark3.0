import { Link, useNavigate } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function MainLayout() {
  const { team, loading, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(4,6,14,0.78)] px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            to="/"
            className="group flex items-center gap-2 text-sm font-black tracking-[0.2em] text-[var(--accent)] uppercase transition hover:opacity-80"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[11px] shadow-[0_0_18px_var(--accent-glow)]">CS</span>
            <span>CineSpark <span className="text-white/40">3.0</span></span>
          </Link>

          <nav className="flex items-center gap-3">
            {loading ? (
              <span className="h-7 w-24 animate-pulse rounded-lg bg-white/10" aria-label="Loading navigation" />
            ) : team ? (
              <>
                <span className="hidden text-xs text-[var(--text-muted)] sm:inline">{team.teamName}</span>
                <Link
                  to="/dashboard"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-red-500/40 hover:text-red-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/leaderboard" className="hidden text-xs text-[var(--text-muted)] transition hover:text-[var(--accent)] sm:inline">
                  Live board
                </Link>
                <Link
                  to="/login"
                  className="text-xs text-[var(--text-muted)] transition hover:text-[var(--accent)]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1.5 text-xs text-[var(--accent)] transition hover:border-[var(--accent)]/60"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-6xl flex-col px-4 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout

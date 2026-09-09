import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginTeam } from '../services/api'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [teamName, setTeamName]       = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  function validate() {
    if (!teamName.trim()) return 'Team name or username is required.'
    if (!password) return 'Password is required.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const res = await loginTeam({ teamName: teamName.trim(), password })
      const { token, role, data } = res.data

      if (role === 'admin') {
        // Store admin token separately and go to admin dashboard
        localStorage.setItem('cinespark_admin_token', token)
        navigate('/admin/dashboard', { replace: true })
      } else {
        // Normal team login
        login(token, data)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex flex-1 flex-col items-center justify-center py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(61,214,198,0.10), transparent 70%), linear-gradient(180deg, #05070d 0%, #0b1020 100%)' }}
      />

      <p className="mb-3 text-xs tracking-[0.35em] text-[var(--accent)] uppercase">Login</p>
      <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">Enter the Spark</h1>
      <p className="mb-10 text-sm text-[var(--text-muted)]">
        Log in as a team or admin.
      </p>

      <div
        className="w-full max-w-md rounded-2xl border border-white/10 p-8"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
      >
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Team Name / Username */}
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-widest text-[var(--text-muted)] uppercase">
              Team Name / Username <span className="text-[var(--accent)]">*</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. CyberCine or admin"
              autoComplete="username"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-white/25 outline-none transition focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/30"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium tracking-widest text-[var(--text-muted)] uppercase">
              Password <span className="text-[var(--accent)]">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-12 text-sm text-[var(--text-primary)] placeholder:text-white/25 outline-none transition focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-semibold tracking-widest uppercase transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, rgba(61,214,198,0.25) 0%, rgba(61,214,198,0.1) 100%)',
              border: '1px solid rgba(61,214,198,0.4)',
              color: 'var(--accent)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Logging in…
              </span>
            ) : 'Login'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Don&apos;t have a team?{' '}
        <Link to="/register" className="text-[var(--accent)] hover:underline">Register here</Link>
      </p>
    </section>
  )
}

export default Login

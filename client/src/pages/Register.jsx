import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerTeam } from '../services/api'

const EMPTY_MEMBERS = ['', '', '', '']

function Register() {
  const navigate = useNavigate()

  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState(EMPTY_MEMBERS)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(null)

  // Auto-redirect to /login after successful registration
  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      navigate('/login')
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, navigate])

  function handleMemberChange(index, value) {
    const updated = [...members]
    updated[index] = value
    setMembers(updated)
  }

  function validate() {
    if (!teamName.trim()) return 'Team name is required.'
    const filled = members.map((m) => m.trim()).filter(Boolean)
    if (filled.length < 1) return 'At least one member name is required.'
    if (filled.length > 4) return 'A team can have a maximum of 4 members.'
    if (!password || password.length < 6) return 'Password must be at least 6 characters long.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const filledMembers = members.map((m) => m.trim()).filter(Boolean)

    setLoading(true)
    try {
      const res = await registerTeam({ teamName: teamName.trim(), members: filledMembers, password })
      setSuccess(`Team "${res.data.data.teamName}" registered successfully!`)
      // Reset form
      setTeamName('')
      setMembers(EMPTY_MEMBERS)
      setPassword('')
      setCountdown(3)
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex flex-1 flex-col items-center justify-center py-12">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(61, 214, 198, 0.10), transparent 70%), linear-gradient(180deg, #05070d 0%, #0b1020 100%)',
        }}
      />

      {/* Header */}
      <p className="mb-3 text-xs tracking-[0.35em] text-[var(--accent)] uppercase">
        Team Registration
      </p>
      <h1 className="mb-2 text-4xl font-bold tracking-tight sm:text-5xl">Join the Spark</h1>
      <p className="mb-10 text-sm text-[var(--text-muted)]">
        Register your team and enter the CineSpark 3.0 competition.
      </p>

      {/* Card */}
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 p-8"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
      >
        {/* Success Banner */}
        {success && (
          <div className="mb-6 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
            <p className="font-semibold">Registration Complete 🎬</p>
            <p className="mt-1 text-[var(--accent)]/80">{success}</p>
            <p className="mt-2 text-xs text-[var(--accent)]/60">
              Redirecting to login in {countdown}s…
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 text-xs underline underline-offset-2 hover:text-[var(--accent)]"
            >
              Go to Login now →
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Team Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-widest text-[var(--text-muted)] uppercase">
                Team Name <span className="text-[var(--accent)]">*</span>
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. CyberCine"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-white/25 outline-none transition focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/30"
              />
            </div>

            {/* Members */}
            <div>
              <label className="mb-1.5 block text-xs font-medium tracking-widest text-[var(--text-muted)] uppercase">
                Team Members{' '}
                <span className="normal-case tracking-normal text-white/30">(1 required, max 4)</span>
              </label>
              <div className="space-y-2.5">
                {members.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs text-[var(--text-muted)]">{idx + 1}</span>
                    <input
                      type="text"
                      value={member}
                      onChange={(e) => handleMemberChange(idx, e.target.value)}
                      placeholder={idx === 0 ? 'Member name (required)' : `Member ${idx + 1} name (optional)`}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-white/25 outline-none transition focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/30"
                    />
                  </div>
                ))}
              </div>
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
                  placeholder="Min. 6 characters"
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
              className="relative w-full overflow-hidden rounded-lg py-3 text-sm font-semibold tracking-widest uppercase transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: loading
                  ? 'rgba(61,214,198,0.2)'
                  : 'linear-gradient(135deg, rgba(61,214,198,0.25) 0%, rgba(61,214,198,0.1) 100%)',
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
                  Registering…
                </span>
              ) : (
                'Register Team'
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer link */}
      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Already registered?{' '}
        <Link to="/login" className="text-[var(--accent)] hover:underline">
          Login here
        </Link>
      </p>
    </section>
  )
}

export default Register

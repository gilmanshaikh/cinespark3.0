import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../../services/api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!username || !password) { setError('Username and password are required.'); return }
    setLoading(true)
    try {
      const res = await adminLogin({ username, password })
      localStorage.setItem('cinespark_admin_token', res.data.token)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)] px-6">
      <div className="w-full max-w-sm">
        <p className="mb-2 text-xs tracking-[0.35em] text-[var(--accent)] uppercase text-center">Admin Portal</p>
        <h1 className="mb-8 text-3xl font-black text-center">CineSpark Admin</h1>

        <div className="rounded-2xl border border-white/10 p-7" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs tracking-widest text-[var(--text-muted)] uppercase">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]/60"
                placeholder="admin" />
            </div>
            <div>
              <label className="mb-1 block text-xs tracking-widest text-[var(--text-muted)] uppercase">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]/60"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-bold tracking-widest uppercase transition disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,rgba(61,214,198,0.3),rgba(61,214,198,0.1))', border: '1px solid rgba(61,214,198,0.4)', color: 'var(--accent)' }}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

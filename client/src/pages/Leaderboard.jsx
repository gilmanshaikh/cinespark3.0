import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard, getEventStatus } from '../services/api'

function RankBadge({ rank }) {
  const colors = { 1: '#fbbf24', 2: '#94a3b8', 3: '#f97316' }
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
      style={{
        background: colors[rank] ? `${colors[rank]}22` : 'rgba(255,255,255,0.06)',
        color: colors[rank] ?? 'var(--text-muted)',
        border: `1px solid ${colors[rank] ? colors[rank] + '55' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {rank}
    </span>
  )
}

export default function Leaderboard() {
  const [teams, setTeams]       = useState([])
  const [event, setEvent]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [lbRes, evRes] = await Promise.all([getLeaderboard(), getEventStatus()])
      setTeams(lbRes.data.data)
      setEvent(evRes.data.data)
      setLastUpdated(new Date())
    } catch { /* silently keep stale data */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000) // auto-refresh every 15s
    return () => clearInterval(interval)
  }, [fetchData])

  const statusColor = { ACTIVE: 'text-green-400', PAUSED: 'text-yellow-400', ENDED: 'text-red-400', NOT_STARTED: 'text-[var(--text-muted)]' }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] px-6 py-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-[var(--accent)] uppercase mb-1">Live Rankings</p>
            <h1 className="text-4xl font-black">Leaderboard</h1>
            {lastUpdated && (
              <p className="text-xs text-white/20 mt-1">Updated {lastUpdated.toLocaleTimeString()}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {event && (
              <span className={`text-xs font-bold tracking-widest uppercase ${statusColor[event.status]}`}>
                ● {event.status.replace('_', ' ')}
              </span>
            )}
            <Link to="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition">← Home</Link>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="h-8 w-8 animate-spin text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : teams.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] py-20">No teams registered yet.</p>
        ) : (
          <div className="space-y-2">
            {teams.map((t) => (
              <div
                key={t.teamName}
                className="flex items-center gap-4 rounded-2xl border border-white/5 px-5 py-4 transition-all hover:border-white/10"
                style={{ background: t.rank <= 3 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)' }}
              >
                <RankBadge rank={t.rank} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{t.teamName}</span>
                    {t.isCompleted && <span className="text-[10px] rounded-full px-2 py-0.5 font-bold" style={{ background: 'rgba(61,214,198,0.15)', color: 'var(--accent)' }}>COMPLETE</span>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{t.members?.join(' · ')}</p>
                </div>

                <div className="hidden sm:flex items-center gap-5 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-[var(--accent)]">Q{Math.min(t.currentQuestionIndex + 1, 10)}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Question</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{t.wordsDecoded}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Words</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-[var(--accent)]">{t.cineCoins}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Coins</p>
                  </div>
                </div>

                {/* Mobile coins */}
                <div className="sm:hidden text-right">
                  <p className="text-sm font-bold text-[var(--accent)]">{t.cineCoins}₡</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Q{t.currentQuestionIndex + 1}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

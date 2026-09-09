import { useState, useEffect } from 'react'
import { getVault } from '../services/api'
import { useAuth } from '../context/AuthContext'

const TOTAL = 10

function LockIcon() {
  return (
    <svg className="h-4 w-4 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

export default function StoryVault({ onClose }) {
  const { team } = useAuth()
  const [vault, setVault] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getVault()
      .then((r) => setVault(r.data.data))
      .catch(() => setVault({ decodedWords: team?.decodedWords ?? [], unlocked: 0, total: TOTAL, isCompleted: false, sentence: null }))
      .finally(() => setLoading(false))
  }, [team])

  const words = vault?.decodedWords ?? []
  const pct = Math.round((words.length / TOTAL) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 p-7"
        style={{ background: '#0a0f1e', boxShadow: '0 0 60px rgba(61,214,198,0.08)' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-xl text-[var(--text-muted)] hover:text-white"
        >×</button>

        {/* Header */}
        <div className="mb-5">
          <p className="text-xs tracking-[0.3em] text-[var(--accent)] uppercase mb-1">Story Vault</p>
          <h2 className="text-2xl font-bold">Decoded Words</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{vault?.label ?? `${words.length}/${TOTAL} words unlocked`}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-1.5 flex justify-between text-xs text-[var(--text-muted)]">
            <span>Story Progress</span>
            <span className="font-bold text-[var(--accent)]">{pct}% Unlocked</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
              style={{ width: `${pct}%`, boxShadow: '0 0 8px rgba(61,214,198,0.5)' }}
            />
          </div>
        </div>

        {/* Word Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="h-7 w-7 animate-spin text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 mb-6">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const word = words[i]
              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center rounded-xl border py-3 px-2 text-center transition-all"
                  style={{
                    border: word ? '1px solid rgba(61,214,198,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    background: word ? 'rgba(61,214,198,0.07)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span className="text-[10px] text-[var(--text-muted)] mb-1">#{i + 1}</span>
                  {word ? (
                    <span className="font-mono text-xs font-bold tracking-wider text-[var(--accent)]">{word}</span>
                  ) : (
                    <LockIcon />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Sentence reveal */}
        {vault?.isCompleted && vault?.sentence && (
          <div
            className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/08 px-5 py-4 text-center"
          >
            <p className="text-xs tracking-widest text-[var(--accent)] uppercase mb-2">Full Story Sentence</p>
            <p className="font-mono text-lg font-bold tracking-wide text-[var(--accent)]">{vault.sentence}</p>
          </div>
        )}
      </div>
    </div>
  )
}

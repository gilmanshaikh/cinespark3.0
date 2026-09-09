import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function GlitchText({ text }) {
  return (
    <h1
      className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl"
      style={{ color: 'var(--accent)', textShadow: '0 0 30px rgba(61,214,198,0.6), 0 0 60px rgba(61,214,198,0.3)' }}
    >
      {text}
    </h1>
  )
}

function Confetti() {
  const [dots] = useState(() => Array.from({ length: 30 }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    top: Math.random() * 60,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random(),
  })))
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((dot, i) => (
        <div
          key={dot.id}
          className="absolute h-1.5 w-1.5 rounded-full animate-bounce"
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            background: i % 3 === 0 ? '#3dd6c6' : i % 3 === 1 ? '#a78bfa' : '#fbbf24',
            animationDelay: `${dot.delay}s`,
            animationDuration: `${dot.duration}s`,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  )
}

export default function Completion() {
  const { team } = useAuth()
  const navigate = useNavigate()
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!team) { navigate('/login', { replace: true }); return }
    if (!team.isCompleted) { navigate('/dashboard', { replace: true }); return }
    const t = setTimeout(() => setRevealed(true), 400)
    return () => clearTimeout(t)
  }, [team, navigate])

  if (!team?.isCompleted) return null

  const sentence = team.decodedWords?.join(' ') ?? ''
  const hintsUsed = team.transactions?.filter((t) => t.type === 'HINT').length ?? 0
  const skipsUsed = team.transactions?.filter((t) => t.type === 'SKIP').length ?? 0
  const completedAt = team.completedAt ? new Date(team.completedAt).toLocaleString() : '—'

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[var(--bg-deep)] overflow-hidden">
      <Confetti />

      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(61,214,198,0.08), transparent 70%)' }}
      />

      <div
        className={`flex flex-col items-center gap-6 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <p className="text-5xl">🎬</p>
        <GlitchText text="Challenge Complete!" />

        <p className="max-w-md text-[var(--text-muted)] text-base">
          Your team decoded all 10 binary clues and assembled the complete story sentence.
        </p>

        {/* Story sentence */}
        <div
          className="w-full max-w-xl rounded-2xl border px-6 py-5"
          style={{ border: '1px solid rgba(61,214,198,0.35)', background: 'rgba(61,214,198,0.05)' }}
        >
          <p className="mb-2 text-xs tracking-[0.3em] text-[var(--accent)] uppercase">Your Story Sentence</p>
          <p className="font-mono text-xl font-bold tracking-wide text-[var(--accent)]">{sentence}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xl">
          {[
            { label: 'Final CineCoins', value: team.cineCoins },
            { label: 'Hints Used', value: hintsUsed },
            { label: 'Skips Used', value: skipsUsed },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <p className="text-2xl font-black text-[var(--accent)]">{s.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">Completed at: {completedAt}</p>

        {/* Filmmaking Challenge Prompt */}
        <div
          className="w-full max-w-xl rounded-2xl border border-white/10 p-6 text-left"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <p className="mb-3 text-xs tracking-[0.3em] text-[var(--accent)] uppercase">🎥 Filmmaking Challenge</p>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Using your decoded sentence as the theme, produce a <strong className="text-white">30–60 second technical short film</strong>.
            Your film must incorporate:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--text-muted)]">
            {[
              'A clear narrative inspired by your decoded sentence',
              'At least one technical/coding concept visualised',
              'Minimum 3 team members on screen',
              'Original voiceover or dialogue',
              'Submitted as an MP4 file to the event organisers',
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-0.5">›</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function LandingPage() {
  const { team } = useAuth()
  const [apiStatus, setApiStatus] = useState('Checking API...')

  useEffect(() => {
    let isMounted = true
    let timerId = null

    async function checkHealth() {
      try {
        const { data } = await api.get('/health')
        if (isMounted) setApiStatus(data.message || 'API connected')
      } catch {
        if (isMounted) setApiStatus('API offline — start the backend server')
      }
    }

    checkHealth()
    timerId = window.setInterval(checkHealth, 15000)
    return () => {
      isMounted = false
      if (timerId) window.clearInterval(timerId)
    }
  }, [])

  return (
    <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden py-16 text-center sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 30%, rgba(61,214,198,0.16), transparent 70%), linear-gradient(180deg, #05070d 0%, #0b1020 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-px bg-gradient-to-r from-transparent via-[var(--accent-border)] to-transparent" />

      <p className="mb-5 flex items-center gap-3 text-[10px] font-bold tracking-[0.4em] text-[var(--accent)] uppercase">
        <span className="h-px w-8 bg-[var(--accent)]/60" /> Technical Competition <span className="h-px w-8 bg-[var(--accent)]/60" />
      </p>

      <h1 className="mb-5 max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-7xl md:text-8xl">
        CineSpark <span className="text-[var(--accent)] glow">3.0</span>
      </h1>

      <p className="max-w-2xl text-base leading-relaxed text-[var(--text-muted)] sm:text-xl">
        Decode the challenge. Build the story. <span className="text-white/80">Your team has one hour to turn logic into cinema.</span>
      </p>

      {/* CTA Buttons */}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {team ? (
          <Link
            to="/dashboard"
            className="inline-block rounded-lg px-8 py-3 text-sm font-semibold tracking-widest uppercase transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(61,214,198,0.25) 0%, rgba(61,214,198,0.1) 100%)',
              border: '1px solid rgba(61,214,198,0.4)',
              color: 'var(--accent)',
            }}
          >
            Go to Dashboard →
          </Link>
        ) : (
          <>
            <Link
              to="/register"
              className="inline-block rounded-lg px-8 py-3 text-sm font-semibold tracking-widest uppercase transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(61,214,198,0.25) 0%, rgba(61,214,198,0.1) 100%)',
                border: '1px solid rgba(61,214,198,0.4)',
                color: 'var(--accent)',
              }}
            >
              Register Team →
            </Link>
            <Link
              to="/login"
              className="inline-block rounded-lg border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold tracking-widest uppercase text-[var(--text-muted)] transition-all hover:border-white/20 hover:text-[var(--text-primary)] active:scale-95"
            >
              Login
            </Link>
          </>
        )}
      </div>

      <div className="mt-10 grid w-full max-w-2xl grid-cols-3 gap-2 text-left sm:gap-3">
        {[
          ['01', 'Solve', 'Technical questions'],
          ['02', 'Decode', 'Binary story clues'],
          ['03', 'Create', 'Make the final film'],
        ].map(([number, title, copy]) => (
          <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left backdrop-blur-sm sm:p-4">
            <p className="mb-3 text-[10px] font-black tracking-widest text-[var(--accent)]">{number}</p>
            <p className="text-sm font-bold text-white sm:text-base">{title}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)] sm:text-xs">{copy}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 text-[10px] tracking-wide text-[var(--text-muted)]">
        <span className={`h-2 w-2 rounded-full ${apiStatus.includes('offline') ? 'bg-red-400' : 'bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]'}`} />
        {apiStatus}
      </div>
    </section>
  )
}

export default LandingPage

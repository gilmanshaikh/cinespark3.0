import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BinaryDecoder from '../components/BinaryDecoder'
import StoryVault from '../components/StoryVault'
import { useEventTimer } from '../hooks/useEventTimer'
import {
  getCurrentQuestion, submitAnswer,
  useHint as apiUseHint, skipQuestion as apiSkipQuestion,
  getTransactions, getEventStatus, reportTabSwitch,
} from '../services/api'

// ── Coin rules (mirror backend) ───────────────────────────────────────────────
const COIN_RULES = {
  CORRECT: 150, WRONG_FIRST: 75, WRONG_REPEAT: 100, HINT: 150, SKIP: 300,
}

// ── Tiny shared components ────────────────────────────────────────────────────
function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6'
  return (
    <svg className={`animate-spin ${s} text-[var(--accent)]`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}

function GoldCoin({ size = 'md' }) {
  const dimension = size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-7 w-7 text-xs'
  return (
    <span className={`${dimension} inline-flex shrink-0 items-center justify-center rounded-full border-2 border-amber-200/80 bg-[radial-gradient(circle_at_32%_25%,#fff4a8_0%,#facc15_35%,#d97706_72%,#92400e_100%)] font-black text-amber-950 shadow-[inset_0_-2px_0_rgba(120,53,15,0.45),0_2px_4px_rgba(0,0,0,0.35)]`} aria-label="CineCoin">
      C
    </span>
  )
}

function CoinBadge({ amount, animate }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tabular-nums transition-all ${animate ? 'coin-pop' : ''}`}
      style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
      <GoldCoin size="sm" />
      {amount?.toLocaleString()}
    </div>
  )
}

function CoinDelta({ delta }) {
  if (!delta) return null
  const pos = delta > 0
  return (
    <span className={`ml-2 text-xs font-bold fade-in ${pos ? 'text-green-400' : 'text-red-400'}`}>
      {pos ? `+${delta}` : delta}
    </span>
  )
}

function Modal({ title, icon, body, confirmLabel, confirmStyle, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="fade-in w-full max-w-md rounded-2xl p-7 shadow-2xl"
        style={{ background: '#070d1e', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="mb-1 text-2xl">{icon}</div>
        <h3 className="mb-1 text-lg font-black">{title}</h3>
        <p className="mb-6 text-sm text-[var(--text-muted)] leading-relaxed">{body}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading}
            className="rounded-xl border border-[var(--border)] bg-white/5 px-5 py-2 text-sm text-[var(--text-muted)] transition hover:text-white disabled:opacity-40">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition disabled:opacity-40"
            style={confirmStyle}>
            {loading && <Spinner size="sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ msg, type }) {
  const colors = {
    success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#4ade80' },
    error:   { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171' },
    info:    { bg: 'rgba(61,214,198,0.15)', border: 'var(--accent-border)', text: 'var(--accent)' },
  }
  const c = colors[type] ?? colors.info
  return (
    <div className="fade-in fixed top-5 right-5 z-50 max-w-xs rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {msg}
    </div>
  )
}

function TransactionDrawer({ onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getTransactions().then(r => setData(r.data.data)).catch(() => setData({ transactions: [], cineCoins: 0 })).finally(() => setLoading(false))
  }, [])
  const colors = { REWARD: '#4ade80', PENALTY: '#f87171', HINT: '#fbbf24', SKIP: '#60a5fa' }
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="fade-in relative z-10 flex w-full max-w-sm flex-col shadow-2xl"
        style={{ background: '#060b18', borderLeft: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="text-xs tracking-widest text-[var(--text-muted)] uppercase mb-0.5">CineCoin Ledger</p>
            <h3 className="font-black text-base">Transactions</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-white transition text-lg">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {loading ? <div className="flex justify-center pt-10"><Spinner size="lg"/></div>
           : !data?.transactions?.length ? <p className="text-center text-xs text-[var(--text-dim)] py-10 italic">No transactions yet.</p>
           : data.transactions.map((t, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white/[0.02] px-4 py-3">
              <div className="min-w-0">
                <span className="text-xs font-black" style={{ color: colors[t.type] ?? '#fff' }}>{t.type}</span>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{t.description}</p>
                <p className="text-[10px] text-[var(--text-dim)] mt-0.5">{new Date(t.timestamp).toLocaleString()}</p>
              </div>
              <span className="ml-3 text-sm font-black tabular-nums flex-shrink-0" style={{ color: t.amount >= 0 ? '#4ade80' : '#f87171' }}>
                {t.amount >= 0 ? `+${t.amount}` : t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { team, updateTeam, logout } = useAuth()
  const navigate = useNavigate()

  const [question, setQuestion]           = useState(null)
  const [qLoading, setQLoading]           = useState(false)
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [selected, setSelected]           = useState(null)
  const [submitting, setSubmitting]       = useState(false)
  const [feedback, setFeedback]           = useState(null)
  const [attempts, setAttempts]           = useState(0)
  const [coinDelta, setCoinDelta]         = useState(null)
  const [coinAnim, setCoinAnim]           = useState(false)
  const [hintText, setHintText]           = useState(null)
  const [showHintModal, setShowHintModal] = useState(false)
  const [hintLoading, setHintLoading]     = useState(false)
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [skipLoading, setSkipLoading]     = useState(false)
  const [binaryClue, setBinaryClue]       = useState(null)
  const [awaitingDecode, setAwaitingDecode] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [showVault, setShowVault]         = useState(false)
  const [eventData, setEventData]         = useState(null)
  const [eventStatus, setEventStatus]     = useState('NOT_STARTED')
  const [toast, setToast]                 = useState(null)
  const [securityLocked, setSecurityLocked] = useState(false)
  const [fullscreenRequired, setFullscreenRequired] = useState(false)
  const securityViolationRef = useRef(false)

  const { formattedTime: timerFormatted } = useEventTimer(eventData)

  function showToast(msg, type = 'info') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function flashCoin(delta) {
    setCoinDelta(delta)
    setCoinAnim(true)
    setTimeout(() => { setCoinDelta(null); setCoinAnim(false) }, 2000)
  }

  // Use a ref so handleBinaryPenalty always has the latest flashCoin without stale closures
  const flashCoinRef = useRef(flashCoin)
  useEffect(() => { flashCoinRef.current = flashCoin })

  const handleBinaryPenalty = useCallback((coinChange, newBalance) => {
    if (coinChange) flashCoinRef.current(coinChange)
    if (newBalance !== undefined) updateTeam({ cineCoins: newBalance })
  }, [updateTeam])

  const fetchQuestion = useCallback(async () => {
    setQLoading(true)
    setSelected(null); setFeedback(null); setHintText(null)
    setBinaryClue(null); setAwaitingDecode(false); setAttempts(0)
    try {
      const res = await getCurrentQuestion()
      const d = res.data
      if (d.finished) navigate('/completion', { replace: true })
      else {
        setQuestion(d.data)
        setTotalQuestions(d.teamState.totalQuestions ?? 10)
        setAttempts(d.teamState.wrongAttempts ?? 0)
        updateTeam(d.teamState)
        if (d.teamState?.isAwaitingDecode && d.binaryClue) {
          setBinaryClue(d.binaryClue)
          setAwaitingDecode(true)
        }
      }
    } catch (err) { showToast(err.response?.data?.message || 'Failed to load question.', 'error') }
    finally { setQLoading(false) }
  }, [updateTeam, navigate])

  // Poll event status every 5s
  useEffect(() => {
    async function poll() {
      try {
        const r = await getEventStatus()
        setEventData(r.data.data)
        setEventStatus(r.data.data?.status ?? 'ACTIVE')
      } catch {}
    }
    poll()
    const iv = setInterval(poll, 5000)
    return () => clearInterval(iv)
  }, [])

  // The admin start action changes the event to ACTIVE. Fetch the first
  // question only after that server-confirmed transition.
  useEffect(() => {
    if (eventStatus === 'ACTIVE' && !question && !qLoading) fetchQuestion()
  }, [eventStatus, question, qLoading, fetchQuestion])

  // Secure mode starts only after the admin releases the event.
  useEffect(() => {
    if (eventStatus !== 'ACTIVE') return undefined
    let fullscreenStarted = false
    if (!document.fullscreenElement) setFullscreenRequired(true)
    document.documentElement.requestFullscreen?.().then(() => {
      fullscreenStarted = true
      setFullscreenRequired(false)
    }).catch(() => {
      showToast('Secure fullscreen needs browser approval. Stay in this tab.', 'info')
    })

    return () => {
      if (fullscreenStarted && document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [eventStatus])

  async function handleSecurityViolation(reason) {
    if (securityViolationRef.current || eventStatus !== 'ACTIVE') return
    securityViolationRef.current = true
    setSecurityLocked(true)
    setSubmitting(true)

    // Preserve the selected response when possible, then permanently lock the team.
    if (selected !== null && !awaitingDecode) {
      try {
        const answer = await submitAnswer({ optionIndex: selected })
        if (answer.data?.cineCoins !== undefined) updateTeam({ cineCoins: answer.data.cineCoins })
      } catch {}
    }
    try {
      const result = await reportTabSwitch()
      if (result.data?.cineCoins !== undefined) updateTeam({ cineCoins: result.data.cineCoins, isDisqualified: true, disqualificationReason: reason })
    } catch {}
    setSubmitting(false)
  }

  // Anti-cheat controls. Browser security cannot prevent screenshots or devtools,
  // but the server lock makes tab/window switching and copying actionable.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) handleSecurityViolation('Tab or window switch detected.')
    }
    function handleFullscreenChange() {
      if (!document.fullscreenElement) handleSecurityViolation('Fullscreen was exited during the test.')
    }
    function blockClipboard(event) {
      event.preventDefault()
      if (eventStatus === 'ACTIVE') handleSecurityViolation('Copy, cut, or context-menu action detected.')
    }
    function blockShortcuts(event) {
      const key = event.key.toLowerCase()
      const restricted = (event.ctrlKey || event.metaKey) && ['c', 'x', 'v', 'a', 'p', 's', 'u'].includes(key)
      const devTools = event.key === 'F12' || (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key))
      if (restricted || devTools) {
        event.preventDefault()
        if (eventStatus === 'ACTIVE') handleSecurityViolation('Restricted keyboard shortcut detected.')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('copy', blockClipboard)
    document.addEventListener('cut', blockClipboard)
    document.addEventListener('contextmenu', blockClipboard)
    document.addEventListener('keydown', blockShortcuts)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('copy', blockClipboard)
      document.removeEventListener('cut', blockClipboard)
      document.removeEventListener('contextmenu', blockClipboard)
      document.removeEventListener('keydown', blockShortcuts)
    }
  }, [eventStatus, selected, awaitingDecode, updateTeam])

  // Redirect if completed
  useEffect(() => {
    if (team?.isCompleted) navigate('/completion', { replace: true })
  }, [team, navigate])

  async function handleSubmitAnswer() {
    if (selected === null) return
    setSubmitting(true); setFeedback(null)
    try {
      const res = await submitAnswer({ optionIndex: selected })
      const d = res.data
      flashCoin(d.coinChange)
      updateTeam({ cineCoins: d.cineCoins })
      if (d.isCorrect) {
        setFeedback({ type: 'success', msg: d.message })
        showToast(d.message, 'success')
        setBinaryClue(d.binaryClue); setAwaitingDecode(true)
      } else {
        setAttempts(d.attempts ?? attempts + 1)
        setFeedback({ type: 'error', msg: d.message })
        showToast(d.message, 'error')
        setSelected(null)
      }
    } catch (err) { showToast(err.response?.data?.message || 'Server error.', 'error') }
    finally { setSubmitting(false) }
  }

  async function handleConfirmHint() {
    setHintLoading(true)
    try {
      const res = await apiUseHint()
      const d = res.data
      flashCoin(d.coinChange)
      updateTeam({ cineCoins: d.cineCoins })
      setHintText(d.hint)
      showToast(d.message, 'info')
    } catch (err) { showToast(err.response?.data?.message || 'Could not use hint.', 'error') }
    finally { setHintLoading(false); setShowHintModal(false) }
  }

  async function handleConfirmSkip() {
    setSkipLoading(true)
    try {
      const res = await apiSkipQuestion()
      const d = res.data
      flashCoin(d.coinChange)
      updateTeam({ cineCoins: d.cineCoins })
      showToast(d.message, 'info')
      setShowSkipModal(false)
      if (d.binaryClue) {
        setBinaryClue(d.binaryClue)
        setAwaitingDecode(true)
      } else fetchQuestion()
    } catch (err) { showToast(err.response?.data?.message || 'Could not skip.', 'error'); setShowSkipModal(false) }
    finally { setSkipLoading(false) }
  }

  function handleDecodeSuccess(data) {
    updateTeam({ decodedWords: data.decodedWords, currentQuestionIndex: data.currentQuestionIndex, cineCoins: data.cineCoins, isCompleted: data.isCompleted ?? false, completedAt: data.completedAt ?? null })
    if (data.finished || data.isCompleted) navigate('/completion', { replace: true })
    else fetchQuestion()
  }

  function handleLogout() { logout(); navigate('/', { replace: true }) }

  const currentQ   = (team?.currentQuestionIndex ?? 0) + 1
  const coins      = team?.cineCoins ?? 1500
  const canHint    = coins >= COIN_RULES.HINT
  const canSkip    = coins >= COIN_RULES.SKIP
  const progress   = Math.min(team?.currentQuestionIndex ?? 0, totalQuestions) / totalQuestions

  // ── Waiting room ──────────────────────────────────────────────────────────
  if (eventStatus === 'NOT_STARTED') return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-deep)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
        <span className="font-black tracking-[0.2em] text-[var(--accent)] uppercase text-sm">CineSpark 3.0</span>
        <button onClick={handleLogout} className="text-xs text-[var(--text-muted)] hover:text-red-400 transition">Logout</button>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6 relative">
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(61,214,198,0.06), transparent 70%)' }}/>
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full pulse-border" style={{ border: '1px solid var(--accent-border)', background: 'var(--accent-soft)' }}>
          <svg className="h-9 w-9 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p className="mb-2 text-xs tracking-[0.5em] text-[var(--accent)] uppercase">Waiting Room</p>
        <h1 className="mb-4 text-4xl font-black sm:text-5xl glow">Standby for Launch</h1>
        <p className="mb-6 max-w-sm text-[var(--text-muted)]">The admin has not started the event yet. Your screen updates automatically, so stay here for the live launch.</p>
        <div className="rounded-2xl px-8 py-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1">Logged in as</p>
          <p className="text-lg font-black text-[var(--accent)]">{team?.teamName}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{team?.members?.join(' · ')}</p>
        </div>
        <div className="mt-5 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
          <p className="mb-3 text-[10px] font-black tracking-[0.3em] text-[var(--accent)] uppercase">Before you begin</p>
          <ul className="space-y-2 text-xs text-[var(--text-muted)]">
            {[
              `You have ${eventData?.durationMinutes ?? 60} minutes once the admin starts the event.`,
              'Solve each technical question to unlock its binary clue.',
              'Hints and skips cost CineCoins; wrong answers reduce your balance.',
              'Keep this tab open during the competition to avoid tab-switch penalties.',
            ].map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--accent)]">✓</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex items-center gap-2 text-[10px] text-[var(--text-dim)]">
          <Spinner size="sm"/> Polling every 5s…
        </div>
      </div>
    </div>
  )

  if (eventStatus === 'ENDED') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-deep)] text-center px-6">
      <p className="text-5xl mb-4">🏁</p>
      <h1 className="text-4xl font-black mb-3">Competition Ended</h1>
      <p className="text-[var(--text-muted)] mb-2">Thanks for participating in CineSpark 3.0!</p>
      <p className="text-sm text-[var(--text-muted)]">Final balance: <span className="font-black text-[var(--accent)]">{coins} CineCoins</span></p>
      <button onClick={handleLogout} className="mt-8 rounded-xl border border-[var(--border)] px-6 py-2.5 text-sm text-[var(--text-muted)] hover:text-white transition">Logout</button>
    </div>
  )

  if (team?.isDisqualified || securityLocked) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-deep)] px-6 text-center text-[var(--text-primary)]">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-400/40 bg-red-400/10 text-4xl">!</div>
      <p className="mb-2 text-xs font-black tracking-[0.4em] text-red-400 uppercase">Test locked</p>
      <h1 className="mb-4 text-4xl font-black">Attempt submitted</h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
        A tab, window, fullscreen, or restricted shortcut violation was detected. Your selected answer was submitted when possible and this team has been disqualified.
      </p>
      <button onClick={handleLogout} className="mt-8 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-[var(--text-muted)] transition hover:text-white">Exit test</button>
    </div>
  )

  if (eventStatus === 'ACTIVE' && fullscreenRequired) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-deep)] px-6 text-center text-[var(--text-primary)]">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] text-3xl">⛶</div>
      <p className="mb-2 text-xs font-black tracking-[0.4em] text-[var(--accent)] uppercase">Secure test mode</p>
      <h1 className="mb-4 text-3xl font-black sm:text-4xl">Enter fullscreen to begin</h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--text-muted)]">The test locks the team if you leave this tab, exit fullscreen, copy content, or use restricted shortcuts.</p>
      <button onClick={() => document.documentElement.requestFullscreen?.().then(() => setFullscreenRequired(false)).catch(() => showToast('Please allow fullscreen for this test.', 'error'))}
        className="mt-8 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-6 py-3 text-sm font-black text-[var(--accent)] transition hover:bg-[var(--accent)]/20">
        Enter secure test
      </button>
    </div>
  )

  // ── Main game UI ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen select-none bg-[var(--bg-deep)] text-[var(--text-primary)]">
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      {showVault && <StoryVault onClose={() => setShowVault(false)}/>}
      {showTransactions && <TransactionDrawer onClose={() => setShowTransactions(false)}/>}

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] px-4 py-2.5"
        style={{ background: 'rgba(4,6,14,0.92)', backdropFilter: 'blur(16px)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">

          {/* Brand */}
          <span className="text-xs font-black tracking-[0.25em] text-[var(--accent)] uppercase shrink-0">
            CineSpark 3.0
          </span>

          {/* Progress bar (center) */}
          <div className="hidden sm:flex flex-1 mx-6 items-center gap-3 max-w-xs">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                style={{ width: `${progress * 100}%`, boxShadow: '0 0 8px rgba(61,214,198,0.6)' }}/>
            </div>
            <span className="text-xs font-bold text-[var(--accent)] tabular-nums shrink-0">{currentQ}/{totalQuestions}</span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Live event timer */}
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-bold tabular-nums"
              style={{
                background: 'rgba(61,214,198,0.08)',
                border: '1px solid rgba(61,214,198,0.25)',
                color: 'var(--accent)',
              }}
              title={`${eventData?.durationMinutes ?? 60} minute competition timer`}
            >
              <svg className="h-3.5 w-3.5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{timerFormatted}</span>
            </div>

            <CoinBadge amount={coins} animate={coinAnim}/>
            {coinDelta && <CoinDelta delta={coinDelta}/>}

            <button onClick={() => setShowVault(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white/5 px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-[var(--accent-border)] hover:text-[var(--accent)]">
              🎬 Vault
            </button>
            <button onClick={() => setShowTransactions(true)}
              className="rounded-xl border border-[var(--border)] bg-white/5 px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-[var(--border-hover)] hover:text-white">
              History
            </button>
            <button onClick={handleLogout}
              className="rounded-xl border border-[var(--border)] bg-white/5 px-3 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-red-500/40 hover:text-red-400">
              Logout
            </button>
          </div>
        </div>

        {/* Paused banner */}
        {eventStatus === 'PAUSED' && (
          <div className="mt-2 rounded-xl text-center py-2 text-xs font-bold"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
            ⏸ Event paused — answers locked until admin resumes
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <main className="mx-auto max-w-6xl px-4 py-6">

        {/* Welcome row */}
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-black">
              <span className="text-[var(--text-muted)] font-medium">Team </span>
              <span className="text-[var(--accent)]">{team?.teamName}</span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{team?.members?.join(' · ')} <span className="mx-1 text-white/20">·</span> Story set {team?.questionSetNumber ?? 'assigning'}</p>
          </div>
          {/* Mobile progress */}
          <div className="flex sm:hidden items-center gap-2 text-xs">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10 w-32">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progress * 100}%` }}/>
            </div>
            <span className="font-bold text-[var(--accent)]">{currentQ}/{totalQuestions}</span>
          </div>
        </div>

        {/* ── Coin Economy Info strip ── */}
        <div className="mb-5 flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)]">
          {[
            { label: 'Correct', val: `+${COIN_RULES.CORRECT}`, color: '#4ade80' },
            { label: '1st Wrong', val: `-${COIN_RULES.WRONG_FIRST}`, color: '#f87171' },
            { label: 'Repeat Wrong', val: `-${COIN_RULES.WRONG_REPEAT}`, color: '#f87171' },
            { label: 'Hint', val: `-${COIN_RULES.HINT}`, color: '#fbbf24' },
            { label: 'Skip', val: `-${COIN_RULES.SKIP}`, color: '#60a5fa' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-white/[0.02] px-3 py-1">
              <span style={{ color: r.color }} className="font-bold">{r.val}</span>
              <span>{r.label}</span>
            </div>
          ))}
        </div>

        {/* ── 3-col grid ── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* LEFT — Question (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Question card */}
            <div className="rounded-2xl p-6 fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {qLoading ? (
                <div className="flex justify-center py-14"><Spinner size="lg"/></div>
              ) : (
                <>
                  {/* Q header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase"
                        style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                        Question {currentQ}
                      </span>
                      {attempts > 0 && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                          {attempts} wrong attempt{attempts > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold"
                        style={{ background: 'rgba(61,214,198,0.06)', border: '1px solid rgba(61,214,198,0.2)', color: 'var(--accent)' }}>
                        ⏱ {timerFormatted}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{totalQuestions - (team?.currentQuestionIndex ?? 0)} left</span>
                    </div>
                  </div>

                  <h2 className="mb-2 text-xl font-black leading-snug">{question?.title}</h2>
                  <p className="mb-5 text-sm leading-relaxed text-[var(--text-muted)]">{question?.description}</p>

                  {/* Code snippet */}
                  {question?.codeSnippet && (
                    <pre className="mb-5 overflow-x-auto rounded-xl px-5 py-4 font-mono text-sm leading-relaxed"
                      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)', color: '#7dd3fc' }}>
                      {question.codeSnippet}
                    </pre>
                  )}

                  {/* Options */}
                  {!awaitingDecode && (
                    <div className="mb-5 grid gap-2.5 sm:grid-cols-2">
                      {question?.options?.map((opt, idx) => {
                        const isSel = selected === idx
                        return (
                          <button key={idx}
                            onClick={() => { if (feedback?.type !== 'success') setSelected(idx) }}
                            disabled={feedback?.type === 'success'}
                            className="group relative rounded-xl px-4 py-3.5 text-left text-sm transition-all duration-200"
                            style={{
                              background: isSel ? 'var(--accent-soft)' : 'rgba(255,255,255,0.02)',
                              border: isSel ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                              color: isSel ? 'var(--accent)' : 'var(--text-muted)',
                              transform: isSel ? 'scale(1.01)' : 'scale(1)',
                              boxShadow: isSel ? '0 0 16px rgba(61,214,198,0.1)' : 'none',
                            }}>
                            <span className="mr-3 inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-black"
                              style={{ background: isSel ? 'var(--accent-border)' : 'rgba(255,255,255,0.06)', color: isSel ? 'var(--accent)' : 'var(--text-muted)' }}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Feedback */}
                  {feedback && (
                    <div className="mb-4 rounded-xl px-4 py-3 text-sm font-medium fade-in"
                      style={{
                        background: feedback.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                        border: feedback.type === 'success' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)',
                        color: feedback.type === 'success' ? '#4ade80' : '#f87171',
                      }}>
                      {feedback.msg}
                    </div>
                  )}

                  {/* Hint reveal */}
                  {hintText && (
                    <div className="mb-4 rounded-xl px-4 py-3 text-sm fade-in"
                      style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.3)', color: '#fde68a' }}>
                      <span className="font-black mr-1">💡 Hint:</span> {hintText}
                    </div>
                  )}

                  {/* Actions */}
                  {!awaitingDecode && (
                    <div className="flex flex-col gap-3">
                      <button onClick={handleSubmitAnswer} disabled={selected === null || submitting || eventStatus !== 'ACTIVE'}
                        className="w-full rounded-xl py-3.5 text-sm font-black tracking-wider uppercase transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, rgba(61,214,198,0.35), rgba(61,214,198,0.12))', border: '1px solid var(--accent-border)', color: 'var(--accent)', boxShadow: selected !== null ? '0 0 20px rgba(61,214,198,0.12)' : 'none' }}>
                        {submitting ? <span className="flex items-center justify-center gap-2"><Spinner size="sm"/> Submitting…</span> : 'Submit Answer'}
                      </button>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button onClick={() => setShowHintModal(true)} disabled={!canHint || !!hintText || eventStatus !== 'ACTIVE'}
                          title={!canHint ? `Need ${COIN_RULES.HINT} coins` : hintText ? 'Already used' : ''}
                          className="rounded-xl border border-[var(--border)] bg-white/[0.03] py-2.5 text-xs font-bold tracking-wide uppercase transition hover:border-yellow-500/40 hover:bg-yellow-500/10 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-35">
                          💡 Hint <span className="opacity-60">-{COIN_RULES.HINT}₡</span>
                        </button>
                        <button onClick={() => setShowSkipModal(true)} disabled={!canSkip || eventStatus !== 'ACTIVE'}
                          title={!canSkip ? `Need ${COIN_RULES.SKIP} coins` : ''}
                          className="rounded-xl border border-[var(--border)] bg-white/[0.03] py-2.5 text-xs font-bold tracking-wide uppercase transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-35">
                          ⏭ Skip <span className="opacity-60">-{COIN_RULES.SKIP}₡</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Binary decoder */}
            {awaitingDecode && binaryClue && (
              <BinaryDecoder
                binaryClue={binaryClue}
                questionNumber={currentQ}
                onSuccess={handleDecodeSuccess}
                onPenalty={handleBinaryPenalty}
                timerFormatted={timerFormatted}
              />
            )}
          </div>

          {/* RIGHT column */}
          <div className="flex flex-col gap-4">

            {/* CineCoins detail card */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-border)' }}>
              <p className="text-[10px] tracking-[0.35em] text-[var(--text-muted)] uppercase mb-1">CineCoins</p>
              <p className={`text-4xl font-black tabular-nums glow ${coinAnim ? 'coin-pop' : ''}`} style={{ color: 'var(--accent)' }}>
                {coins.toLocaleString()}
              </p>
              {coinDelta && <p className="text-xs font-bold mt-1 fade-in" style={{ color: coinDelta > 0 ? '#4ade80' : '#f87171' }}>{coinDelta > 0 ? `+${coinDelta}` : coinDelta} just now</p>}
              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Hint available at</span><span className="font-bold">{COIN_RULES.HINT}₡</span>
                </div>
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Skip available at</span><span className="font-bold">{COIN_RULES.SKIP}₡</span>
                </div>
                <div className="h-px bg-white/5 my-2"/>
                {/* Balance bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                    <span>Balance</span><span>{Math.round((coins / 1500) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((coins / 1500) * 100, 100)}%`, background: coins > 600 ? 'var(--accent)' : coins > 300 ? '#fbbf24' : '#f87171' }}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Decoded Words */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] tracking-[0.35em] text-[var(--text-muted)] uppercase">Story Words</p>
                <button onClick={() => setShowVault(true)} className="text-[10px] text-[var(--accent)] hover:underline">View Vault →</button>
              </div>
              {team?.decodedWords?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {team.decodedWords.map((w, i) => (
                    <span key={i} className="rounded-lg px-2.5 py-1 font-mono text-xs font-bold"
                      style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                      {w}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-[var(--text-dim)]">Solve questions to decode words…</p>
              )}
            </div>

            {/* Team */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] tracking-[0.35em] text-[var(--text-muted)] uppercase mb-3">Team Members</p>
              <div className="space-y-2">
                {team?.members?.map((m, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                      {m[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-[var(--text-muted)]">{m}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Modals */}
      {showHintModal && (
        <Modal title="Use a Hint?" icon="💡"
          body={`Reveals the hint for this question. Costs ${COIN_RULES.HINT} CineCoins. You currently have ${coins} coins.`}
          confirmLabel={`Use Hint (−${COIN_RULES.HINT}₡)`}
          confirmStyle={{ background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)', color: '#fde047' }}
          onConfirm={handleConfirmHint} onCancel={() => setShowHintModal(false)} loading={hintLoading}/>
      )}
      {showSkipModal && (
        <Modal title="Skip this Question?" icon="⏭"
          body={`Skips this question and reveals the binary clue to decode. Costs ${COIN_RULES.SKIP} CineCoins. You currently have ${coins} coins.`}
          confirmLabel={`Skip (−${COIN_RULES.SKIP}₡)`}
          confirmStyle={{ background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.4)', color: '#93c5fd' }}
          onConfirm={handleConfirmSkip} onCancel={() => setShowSkipModal(false)} loading={skipLoading}/>
      )}
    </div>
  )
}

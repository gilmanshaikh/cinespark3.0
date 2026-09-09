import { useState } from 'react'
import { verifyBinary } from '../services/api'

function BinaryDecoder({ binaryClue, questionNumber, onSuccess, onPenalty, timerFormatted }) {
  const [word, setWord]         = useState('')
  const [status, setStatus]     = useState(null) // 'success' | 'error' | null
  const [message, setMessage]   = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!word.trim()) return
    setLoading(true)
    setStatus(null)

    try {
      const res = await verifyBinary({ word: word.trim() })
      const d = res.data

      if (d.isMatch) {
        setStatus('success')
        setMessage(d.message)
        setTimeout(() => onSuccess(d), 1200)
      } else {
        setStatus('error')
        setMessage(d.message)
        // onPenalty lets Dashboard flash the coin delta and sync balance
        if (onPenalty) {
          onPenalty(d.coinChange, d.cineCoins)
        }
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.message || 'Server error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        background: 'rgba(0,255,180,0.03)',
        border: '1px solid rgba(61,214,198,0.25)',
        boxShadow: '0 0 30px rgba(61,214,198,0.06)',
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--accent)] uppercase">
            Binary Decoder — Q{questionNumber}
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider"
          style={{
            background: 'rgba(61,214,198,0.1)',
            border: '1px solid rgba(61,214,198,0.3)',
            color: 'var(--accent)',
          }}
        >
          DECIPHER CLUE
        </span>
      </div>

      {/* Binary Clue & Timer Display (Side by Side) */}
      <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
        {/* Binary Clue Display */}
        <div
          className="md:col-span-2 rounded-xl px-5 py-4 font-mono text-sm leading-relaxed tracking-wider flex flex-col justify-center"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(61,214,198,0.2)',
            color: '#3dd6c6',
            wordBreak: 'break-all',
            textShadow: '0 0 8px rgba(61,214,198,0.5)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[var(--accent)] opacity-80 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-ping" />
              Binary Clue
            </span>
            <span className="text-[10px] font-sans text-[var(--text-dim)]">8-bit ASCII</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono tracking-widest text-[#3dd6c6]">
            {binaryClue}
          </div>
        </div>

        {/* 1 HR Timer Display — right beside the binary number */}
        <div
          className="rounded-xl px-4 py-4 flex flex-col items-center justify-center text-center"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(61,214,198,0.3)',
            boxShadow: '0 0 20px rgba(61,214,198,0.08)',
          }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent)] tracking-widest uppercase mb-1">
            <svg className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" style={{ animationDuration: '8s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Timer</span>
          </div>
          <div className="font-mono text-2xl font-black tracking-wider text-[var(--accent)] glow tabular-nums">
            {timerFormatted || '01:00:00'}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] mt-1">Time Remaining</span>
        </div>
      </div>

      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Decode the binary string above into plain English and enter it below to proceed.
      </p>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Your decoded word…"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm uppercase tracking-widest text-[var(--text-primary)] placeholder:text-white/20 outline-none transition focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/30"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !word.trim()}
          className="rounded-lg px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg,rgba(61,214,198,0.3),rgba(61,214,198,0.1))',
            border: '1px solid rgba(61,214,198,0.4)',
            color: 'var(--accent)',
          }}
        >
          {loading ? '…' : 'Verify'}
        </button>
      </form>

      {/* Feedback */}
      {status === 'success' && (
        <div className="mt-3 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2 text-sm text-[var(--accent)]">
          ✓ {message}
        </div>
      )}
      {status === 'error' && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          ✗ {message}
        </div>
      )}
    </div>
  )
}

export default BinaryDecoder

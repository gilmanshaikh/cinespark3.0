import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminGetTeams, adminAdjustCoins, adminDeleteTeam,
  adminReinstateTeam,
  adminGetQuestions, adminCreateQuestion, adminUpdateQuestion,
  adminGetEventStatus, adminSetEventStatus, adminGetLeaderboard, getAdminMe,
} from '../../services/api'

// ── helpers ───────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] shadow-[0_0_20px_rgba(61,214,198,0.16)]">
      <svg className="h-4 w-4 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="13" r="7" />
        <path d="M12 4.5v8l4 2.5" />
        <path d="M9 2.5h6" />
      </svg>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
function Toast({ msg, type }) {
  return (
    <div className="fixed top-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm shadow-xl"
      style={{
        background: type === 'success' ? 'rgba(61,214,198,0.15)' : 'rgba(239,68,68,0.15)',
        border: type === 'success' ? '1px solid rgba(61,214,198,0.4)' : '1px solid rgba(239,68,68,0.4)',
        color: type === 'success' ? 'var(--accent)' : '#f87171',
      }}>
      {msg}
    </div>
  )
}

const TABS = ['Teams', 'Questions', 'Leaderboard', 'Event']
const EMPTY_Q = { questionNumber: '', title: '', description: '', codeSnippet: '', options: ['', '', '', ''], correctOptionIndex: 0, hint: '', binaryClue: '', decodedWord: '' }

// ── Teams Tab ─────────────────────────────────────────────────────────────────
function TeamsTab({ toast }) {
  const [teams, setTeams]   = useState([])
  const [loading, setLoading] = useState(true)
  const [coinInputs, setCoinInputs] = useState({})
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setTeams((await adminGetTeams()).data.data) } catch { toast('Failed to load teams', 'error') } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  async function handleAdjust(id) {
    const amt = Number(coinInputs[id] ?? 0)
    if (!amt) return
    try { await adminAdjustCoins(id, amt); toast(`Coins adjusted by ${amt}`, 'success'); load() } catch (e) { toast(e.response?.data?.message ?? 'Error', 'error') }
  }
  async function handleDelete(id, name) {
    if (!confirm(`Delete team "${name}"?`)) return
    try { await adminDeleteTeam(id); toast('Team deleted', 'success'); load() } catch (e) { toast(e.response?.data?.message ?? 'Error', 'error') }
  }
  async function handleReinstate(id) {
    try { await adminReinstateTeam(id); toast('Team reinstated', 'success'); load() } catch (e) { toast(e.response?.data?.message ?? 'Could not reinstate team', 'error') }
  }
  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  const visibleTeams = teams.filter((team) => {
    const query = search.trim().toLowerCase()
    return !query || team.teamName.toLowerCase().includes(query) || team.members?.some((member) => member.toLowerCase().includes(query))
  })

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)]">{teams.length} registered teams</p>
        </div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams or members" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent-border)] sm:w-72" />
      </div>
      <div className="space-y-3">
      {visibleTeams.map((t) => (
        <div key={t._id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="font-bold">{t.teamName}</p>
              <p className="text-xs text-[var(--text-muted)]">{t.members?.join(' · ')}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-[var(--accent)] font-bold"><span className="text-amber-300">●</span>{t.cineCoins}</span>
              <span className="text-[var(--text-muted)]">Q{t.currentQuestionIndex + 1}</span>
              <span className="text-[var(--text-muted)]">Set {t.questionSetNumber ?? 'pending'}</span>
              {t.isCompleted && <span className="text-xs rounded-full px-2 py-0.5 font-bold" style={{ background: 'rgba(61,214,198,0.15)', color: 'var(--accent)' }}>DONE</span>}
              {t.isDisqualified && <span className="text-xs rounded-full px-2 py-0.5 font-bold" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>DISQUALIFIED</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="number" placeholder="±coins" value={coinInputs[t._id] ?? ''}
              onChange={e => setCoinInputs(p => ({ ...p, [t._id]: e.target.value }))}
              className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none" />
            <button onClick={() => handleAdjust(t._id)} className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs text-yellow-400 transition hover:bg-yellow-500/20">Adjust Coins</button>
            <button onClick={() => handleDelete(t._id, t.teamName)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20">Delete</button>
            {t.isDisqualified && <button onClick={() => handleReinstate(t._id)} className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs text-green-400 transition hover:bg-green-500/20">Reinstate</button>}
          </div>
        </div>
      ))}
      {visibleTeams.length === 0 && <p className="text-center text-[var(--text-muted)] py-10">No matching teams found.</p>}
      </div>
    </div>
  )
}

// ── Questions Tab ─────────────────────────────────────────────────────────────
function QuestionsTab({ toast }) {
  const [questions, setQuestions] = useState([])
  const [sets, setSets] = useState([])
  const [selectedSet, setSelectedSet] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null) // question object | 'new' | null
  const [form, setForm]           = useState(EMPTY_Q)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = (await adminGetQuestions()).data
      setQuestions(response.data)
      const fallbackSets = Object.values(response.data.reduce((groups, question) => {
        const setNumber = Number(question.setNumber ?? 1)
        groups[setNumber] = groups[setNumber] || { _id: setNumber, count: 0 }
        groups[setNumber].count += 1
        return groups
      }, {}))
      setSets((response.sets?.length ? response.sets : fallbackSets).map((set) => ({ ...set, _id: Number(set._id) })).sort((a, b) => a._id - b._id))
    } catch { toast('Failed to load questions', 'error') } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  function openEdit(q) { setForm({ ...q, setNumber: q.setNumber ?? 1, sequence: q.sequence ?? q.questionNumber, options: [...q.options] }); setEditing(q) }

  async function handleSave() {
    const payload = { ...form, setNumber: Number(form.setNumber), sequence: Number(form.sequence), correctOptionIndex: Number(form.correctOptionIndex), questionNumber: Number(form.questionNumber), options: form.options }
    try {
      if (editing === 'new') { await adminCreateQuestion(payload); toast('Question created', 'success') }
      else { await adminUpdateQuestion(editing._id, payload); toast('Question updated', 'success') }
      setEditing(null); load()
    } catch (e) { toast(e.response?.data?.message ?? 'Error saving question', 'error') }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (editing !== null) return (
    <div className="rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <h3 className="text-lg font-bold mb-4">{editing === 'new' ? 'New Question' : `Edit Q${form.questionNumber}`}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {[['setNumber','Set number'],['sequence','Sentence position (1-10)'],['questionNumber','Global question ID'],['title','Title'],['hint','Hint'],['binaryClue','Binary Clue'],['decodedWord','Decoded Word'],['correctOptionIndex','Correct Option Index (0-3)']].map(([k,l]) => (
          <div key={k}>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">{l}</label>
            <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none resize-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Code Snippet (optional)</label>
          <textarea value={form.codeSnippet} onChange={e => setForm(p => ({ ...p, codeSnippet: e.target.value }))} rows={2}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm outline-none resize-none" />
        </div>
        {form.options.map((opt, i) => (
          <div key={i}>
            <label className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Option {String.fromCharCode(65+i)}</label>
            <input value={opt} onChange={e => { const o = [...form.options]; o[i] = e.target.value; setForm(p => ({ ...p, options: o })) }}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={handleSave} className="rounded-lg px-5 py-2 text-sm font-bold transition"
          style={{ background: 'rgba(61,214,198,0.2)', border: '1px solid rgba(61,214,198,0.4)', color: 'var(--accent)' }}>Save</button>
        <button onClick={() => setEditing(null)} className="rounded-lg border border-white/10 px-5 py-2 text-sm text-[var(--text-muted)] transition hover:text-white">Cancel</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.3em] text-[var(--accent)] uppercase">Question library</p>
          <h2 className="mt-1 text-2xl font-black">{selectedSet === null ? 'Story sets' : `Set ${selectedSet}`}</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{selectedSet === null ? 'Choose a set to view its ten ordered questions.' : 'Choose a question to edit its options, answer, clue, and story word.'}</p>
        </div>
        {selectedSet !== null && <button onClick={() => setSelectedSet(null)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-[var(--text-muted)] transition hover:text-white">← All sets</button>}
      </div>

      {selectedSet === null && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sets.map((set) => (
          <button key={set._id} onClick={() => setSelectedSet(set._id)} className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5 text-left transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-soft)]">
            <span className="text-lg font-black text-white">Set {set._id}</span>
            <span className="text-xl text-[var(--accent)] transition-transform group-hover:translate-x-1">→</span>
          </button>
        ))}
        {sets.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-[var(--text-muted)]">No question sets have been created yet.</p>}
      </div>}
      {selectedSet !== null && <button onClick={() => { setForm({ ...EMPTY_Q, setNumber: selectedSet, sequence: 1 }); setEditing('new') }} className="mb-4 rounded-lg px-4 py-2 text-sm font-bold transition"
        style={{ background: 'rgba(61,214,198,0.15)', border: '1px solid rgba(61,214,198,0.35)', color: 'var(--accent)' }}>
        + Add Question to Set {selectedSet}
      </button>}
      {selectedSet !== null && <div className="space-y-2">
        {questions.filter((q) => selectedSet === null || q.setNumber === selectedSet).map((q) => (
          <button key={q._id} onClick={() => openEdit(q)} className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-left transition hover:border-[var(--accent-border)] hover:bg-white/[0.04]">
            <div>
              <div><span className="text-xs font-black text-[var(--accent)]">Question {q.sequence}</span><span className="ml-2 text-[10px] text-[var(--text-muted)]">Global ID {q.questionNumber}</span></div>
              <span className="mt-1 block text-sm font-bold">{q.title}</span>
              <span className="mt-1 block font-mono text-[10px] text-[var(--text-muted)]">{q.decodedWord || 'No decoded word assigned'}</span>
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)]">Edit →</span>
          </button>
        ))}
        {questions.filter((q) => selectedSet === null || q.setNumber === selectedSet).length === 0 && <p className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-[var(--text-muted)]">No questions in this set yet.</p>}
      </div>}
    </div>
  )
}

// ── Leaderboard Tab ───────────────────────────────────────────────────────────
function LeaderboardTab() {
  const [teams, setTeams]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGetLeaderboard().then(r => setTeams(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-[var(--text-muted)] border-b border-white/5">
          {['#','Team','Q','Words','Coins','Done'].map(h => <th key={h} className="py-2 pr-4">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {teams.map(t => (
          <tr key={t.teamName} className="border-b border-white/5">
            <td className="py-2 pr-4 text-[var(--text-muted)]">{t.rank}</td>
            <td className="py-2 pr-4 font-medium">{t.teamName}</td>
            <td className="py-2 pr-4 text-[var(--accent)]">{t.currentQuestionIndex + 1}</td>
            <td className="py-2 pr-4">{t.wordsDecoded}</td>
            <td className="py-2 pr-4 text-[var(--accent)]">{t.cineCoins}</td>
            <td className="py-2">{t.isCompleted ? '✓' : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Event Tab ─────────────────────────────────────────────────────────────────
function EventTab({ toast }) {
  const [event, setEvent]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    try { setEvent((await adminGetEventStatus()).data.data) } catch {} finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const [durationInput, setDurationInput] = useState('60')

  useEffect(() => {
    if (event?.durationMinutes !== undefined) {
      setDurationInput(String(event.durationMinutes))
    }
  }, [event?.durationMinutes])

  async function setStatus(s) {
    setActing(true)
    try {
      const nextDuration = Number(durationInput)
      const safeDuration = Number.isFinite(nextDuration) && nextDuration > 0 ? nextDuration : 60
      setEvent((await adminSetEventStatus(s, safeDuration)).data.data)
      toast(`Event ${s}${safeDuration ? ` • ${safeDuration} min` : ''}`, 'success')
    } catch (e) { toast(e.response?.data?.message ?? 'Error', 'error') } finally { setActing(false) }
  }

  async function saveDuration() {
    const nextDuration = Number(durationInput)
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) {
      toast('Duration must be a positive number.', 'error')
      return
    }

    try {
      const data = (await adminSetEventStatus(event?.status ?? 'NOT_STARTED', Math.min(300, Math.round(nextDuration)))).data.data
      setEvent(data)
      toast(`Timer updated to ${data.durationMinutes} minutes.`, 'success')
    } catch (e) { toast(e.response?.data?.message ?? 'Error updating timer', 'error') }
  }

  const statusColor = { ACTIVE: '#4ade80', PAUSED: '#fbbf24', ENDED: '#f87171', NOT_STARTED: '#8b97b8' }
  const ACTIONS = [
    { label: 'Start Event', status: 'ACTIVE', style: { border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', background: 'rgba(74,222,128,0.1)' } },
    { label: 'Pause Event', status: 'PAUSED', style: { border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24', background: 'rgba(251,191,36,0.1)' } },
    { label: 'Resume Event', status: 'ACTIVE', style: { border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', background: 'rgba(74,222,128,0.1)' } },
    { label: 'End Event', status: 'ENDED', style: { border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', background: 'rgba(248,113,113,0.1)' } },
    { label: 'Open Waiting Room', status: 'NOT_STARTED', style: { border: '1px solid rgba(96,165,250,0.4)', color: '#60a5fa', background: 'rgba(96,165,250,0.1)' } },
  ]

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 text-center shadow-[0_20px_45px_rgba(0,0,0,0.18)]">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--text-muted)]">Current Status</p>
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <svg className="h-5 w-5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="13" r="7" />
                <path d="M12 4.5v8l4 2.5" />
                <path d="M9 2.5h6" />
              </svg>
            </div>
            <p className="text-3xl font-black leading-none" style={{ color: statusColor[event?.status ?? 'NOT_STARTED'] }}>
              {event?.status?.replace('_', ' ') ?? 'NOT_STARTED'}
            </p>
          </div>
          {event?.startTime && <p className="text-xs text-[var(--text-muted)]">Started: {new Date(event.startTime).toLocaleString()}</p>}
          <p className="mt-1 text-xs text-[var(--text-muted)]">Duration: {event?.durationMinutes ?? 60} min</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-[var(--text-muted)]">
        <p className="mb-2 font-black tracking-widest text-[var(--accent)] uppercase">Launch checklist</p>
        <p>Teams stay in the waiting room until Start Event. Each team receives one complete set of 10 questions, 10 binary clues, and a 10-word sentence.</p>
      </div>

      <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 text-[10px] font-black tracking-[0.2em] text-[var(--accent)] uppercase">Competition Timer</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <svg className="h-4 w-4 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="13" r="7" />
              <path d="M12 4.5v8l4 2.5" />
              <path d="M9 2.5h6" />
            </svg>
            <input
              type="number"
              min="5"
              max="300"
              step="5"
              value={durationInput}
              onChange={(event) => setDurationInput(event.target.value)}
              className="w-24 bg-transparent text-sm text-white outline-none"
            />
            <span className="text-sm text-[var(--text-muted)]">min</span>
          </div>
          <button onClick={saveDuration} className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-2.5 text-xs font-bold text-[var(--accent)] transition hover:opacity-90">
            Save timer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(a => (
          <button key={a.label} onClick={() => setStatus(a.status)} disabled={acting}
            className="rounded-xl py-3 text-sm font-bold transition disabled:opacity-40" style={a.style}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab]       = useState('Teams')
  const [toast, setToast]   = useState(null)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    getAdminMe().then(() => setAuthed(true)).catch(() => navigate('/admin/login', { replace: true }))
  }, [navigate])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleLogout() {
    localStorage.removeItem('cinespark_admin_token')
    navigate('/admin/login', { replace: true })
  }

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)]">
      <Spinner />
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)]">
      {toast && <Toast {...toast} />}

      <header className="border-b border-white/5 bg-[rgba(5,7,15,0.82)] px-6 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <span className="text-xs font-black tracking-[0.28em] text-[var(--accent)] uppercase">CineSpark</span>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--text-muted)]">Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-mono font-bold text-[var(--accent)] shadow-[0_0_18px_rgba(61,214,198,0.12)]">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="13" r="7" />
                <path d="M12 4.5v8l4 2.5" />
                <path d="M9 2.5h6" />
              </svg>
              <span>{event?.durationMinutes ?? 60} min</span>
            </div>
            <button onClick={handleLogout} className="text-xs text-[var(--text-muted)] transition hover:text-red-400">Logout</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/5 px-6">
        <div className="mx-auto flex max-w-5xl gap-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-5 py-3 text-sm font-medium transition border-b-2"
              style={{ borderColor: tab === t ? 'var(--accent)' : 'transparent', color: tab === t ? 'var(--accent)' : 'var(--text-muted)' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {tab === 'Teams'       && <TeamsTab toast={showToast} />}
        {tab === 'Questions'   && <QuestionsTab toast={showToast} />}
        {tab === 'Leaderboard' && <LeaderboardTab />}
        {tab === 'Event'       && <EventTab toast={showToast} />}
      </main>
    </div>
  )
}

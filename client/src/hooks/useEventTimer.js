import { useState, useEffect, useRef } from 'react'

const ONE_HOUR_MS = 60 * 60 * 1000

function formatMs(ms) {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function calculateRemaining(eventData) {
  if (eventData?.startTime && ['ACTIVE', 'PAUSED'].includes(eventData.status)) {
    const dur = (eventData.durationMinutes || 60) * 60 * 1000
    const end = new Date(eventData.startTime).getTime() + dur
    return Math.max(0, end - Date.now())
  }
  let localStart = localStorage.getItem('cinespark_timer_start')
  if (!localStart) {
    localStart = Date.now().toString()
    localStorage.setItem('cinespark_timer_start', localStart)
  }
  const elapsed = Date.now() - Number(localStart)
  return Math.max(0, ONE_HOUR_MS - elapsed)
}

export function useEventTimer(eventData) {
  // eventData: { status, startTime, durationMinutes }
  const [remainingMs, setRemainingMs] = useState(() => calculateRemaining(eventData))

  // Keep a ref so the interval always reads latest eventData without recreating every poll
  const eventDataRef = useRef(eventData)
  useEffect(() => { eventDataRef.current = eventData }, [eventData])

  useEffect(() => {
    // Recalculate immediately when event data changes (e.g. admin starts event)
    setRemainingMs(calculateRemaining(eventData))

    if (eventData?.status === 'PAUSED') {
      return // freeze the countdown while paused
    }

    const interval = setInterval(() => {
      setRemainingMs(calculateRemaining(eventDataRef.current))
    }, 1000)

    return () => clearInterval(interval)
  }, [eventData?.status, eventData?.startTime, eventData?.durationMinutes])

  const isExpired = remainingMs <= 0
  const formattedTime = formatMs(remainingMs)

  return {
    remainingMs,
    formattedTime,
    isExpired,
  }
}

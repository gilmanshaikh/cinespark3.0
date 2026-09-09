function normalizeDurationMinutes(value, fallback = 60) {
  const numericValue = Number(value)
  const safeFallback = Number.isFinite(Number(fallback)) && Number(fallback) > 0 ? Number(fallback) : 60

  if (!Number.isFinite(numericValue)) return Math.min(300, Math.max(5, Math.round(safeFallback)))
  if (numericValue < 5) return 5
  if (numericValue > 300) return 300

  return Math.round(numericValue)
}

module.exports = {
  normalizeDurationMinutes,
}

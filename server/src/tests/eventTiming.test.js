const test = require('node:test')
const assert = require('node:assert/strict')

const { normalizeDurationMinutes } = require('../utils/eventTiming')

test('normalizeDurationMinutes keeps valid values inside the supported range', () => {
  assert.equal(normalizeDurationMinutes(60), 60)
  assert.equal(normalizeDurationMinutes('90'), 90)
  assert.equal(normalizeDurationMinutes(300), 300)
})

test('normalizeDurationMinutes clamps invalid values to safe defaults', () => {
  assert.equal(normalizeDurationMinutes(0), 5)
  assert.equal(normalizeDurationMinutes(-10), 5)
  assert.equal(normalizeDurationMinutes(999), 300)
  assert.equal(normalizeDurationMinutes('abc', 45), 45)
})

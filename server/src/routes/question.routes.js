const express = require('express')
const { protectTeam } = require('../middleware/authMiddleware')
const {
  getCurrentQuestion,
  submitAnswer,
  useHint,
  skipQuestion,
  verifyBinary,
  reportTabSwitch,
} = require('../controllers/questionController')

const router = express.Router()

// All question routes are protected
router.get('/current', protectTeam, getCurrentQuestion)
router.post('/answer', protectTeam, submitAnswer)
router.post('/hint', protectTeam, useHint)
router.post('/skip', protectTeam, skipQuestion)
router.post('/verify-binary', protectTeam, verifyBinary)
router.post('/tab-switch', protectTeam, reportTabSwitch)

module.exports = router

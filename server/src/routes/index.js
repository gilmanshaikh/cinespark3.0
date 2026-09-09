const express = require('express')
const { getHealth } = require('../controllers/healthController')
const authRoutes = require('./auth.routes')
const questionRoutes = require('./question.routes')
const teamRoutes = require('./team.routes')
const adminRoutes = require('./admin.routes')
const eventRoutes = require('./event.routes')
const leaderboardRoutes = require('./leaderboard.routes')

const router = express.Router()

router.get('/health', getHealth)
router.use('/auth', authRoutes)
router.use('/questions', questionRoutes)
router.use('/team', teamRoutes)
router.use('/admin', adminRoutes)
router.use('/event', eventRoutes)
router.use('/leaderboard', leaderboardRoutes)

module.exports = router

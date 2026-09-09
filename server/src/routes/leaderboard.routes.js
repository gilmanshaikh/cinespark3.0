const express = require('express')
const { getLeaderboard } = require('../controllers/adminController')

const router = express.Router()

// Public leaderboard
router.get('/', getLeaderboard)

module.exports = router

const express = require('express')
const { registerTeam, loginTeam, getMe } = require('../controllers/authController')
const { protectTeam } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/register', registerTeam)
router.post('/login', loginTeam)
router.get('/me', protectTeam, getMe)

module.exports = router

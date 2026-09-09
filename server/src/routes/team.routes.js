const express = require('express')
const { protectTeam } = require('../middleware/authMiddleware')
const { getTransactions, getVault } = require('../controllers/questionController')

const router = express.Router()

router.get('/transactions', protectTeam, getTransactions)
router.get('/vault', protectTeam, getVault)

module.exports = router

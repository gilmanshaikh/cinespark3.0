const express = require('express')
const { protectAdmin } = require('../middleware/adminMiddleware')
const { adminLogin, getAdminMe } = require('../controllers/adminAuthController')
const {
  getAllTeams, adjustCoins, deleteTeam, clearDisqualification,
  getAllQuestions, createQuestion, updateQuestion, deleteQuestion,
  getEventStatus, setEventStatus, getLeaderboard,
} = require('../controllers/adminController')

const router = express.Router()

// Auth
router.post('/login', adminLogin)
router.get('/me', protectAdmin, getAdminMe)

// Teams
router.get('/teams', protectAdmin, getAllTeams)
router.patch('/teams/:id/coins', protectAdmin, adjustCoins)
router.delete('/teams/:id', protectAdmin, deleteTeam)
router.patch('/teams/:id/reinstate', protectAdmin, clearDisqualification)

// Questions
router.get('/questions', protectAdmin, getAllQuestions)
router.post('/questions', protectAdmin, createQuestion)
router.put('/questions/:id', protectAdmin, updateQuestion)
router.delete('/questions/:id', protectAdmin, deleteQuestion)

// Event
router.get('/event/status', protectAdmin, getEventStatus)
router.post('/event/status', protectAdmin, setEventStatus)

// Leaderboard (admin view)
router.get('/leaderboard', protectAdmin, getLeaderboard)

module.exports = router

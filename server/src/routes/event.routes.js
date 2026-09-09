const express = require('express')
const { getEventStatus } = require('../controllers/adminController')

const router = express.Router()

// Public event status (used by frontend for event lock banner)
router.get('/status', getEventStatus)

module.exports = router

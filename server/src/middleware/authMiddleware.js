const jwt = require('jsonwebtoken')
const Team = require('../models/Team')

/**
 * Protect routes — verifies Bearer token and attaches team to req.team.
 * Must be used as Express middleware: router.get('/me', protectTeam, getMe)
 */
async function protectTeam(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorised. No token provided.' })
    }

    const token = authHeader.split(' ')[1]

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ success: false, message: 'Not authorised. Token is invalid or expired.' })
    }

    const team = await Team.findById(decoded.id).select('-password')
    if (!team) {
      return res.status(401).json({ success: false, message: 'Not authorised. Team not found.' })
    }

    req.team = team
    next()
  } catch (err) {
    console.error('Auth middleware error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error during authentication.' })
  }
}

module.exports = { protectTeam }

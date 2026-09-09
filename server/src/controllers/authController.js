const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Team = require('../models/Team')
const Admin = require('../models/Admin')
const generateToken = require('../utils/generateToken')

/**
 * POST /api/auth/register
 */
async function registerTeam(req, res) {
  try {
    const { teamName, members, password } = req.body

    if (!teamName || typeof teamName !== 'string' || teamName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Team name is required.' })
    }
    if (!Array.isArray(members) || members.length < 1) {
      return res.status(400).json({ success: false, message: 'At least one member name is required.' })
    }
    const cleanedMembers = members.map((m) => (typeof m === 'string' ? m.trim() : '')).filter(Boolean)
    if (cleanedMembers.length < 1) return res.status(400).json({ success: false, message: 'At least one member name is required.' })
    if (cleanedMembers.length > 4) return res.status(400).json({ success: false, message: 'A team can have a maximum of 4 members.' })
    if (!password || typeof password !== 'string' || password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' })

    const team = await Team.create({ teamName: teamName.trim(), members: cleanedMembers, password })
    return res.status(201).json({ success: true, message: 'Team registered successfully!', data: { id: team._id, teamName: team.teamName } })
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Team name is already taken. Please choose a different name.' })
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: Object.values(err.errors).map((e) => e.message).join(' ') })
    console.error('Registration error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error. Please ensure the database is connected and try again.' })
  }
}

/**
 * POST /api/auth/login
 * Handles both team login and admin login from the same endpoint.
 * Admin credentials return role:'admin' so the frontend can redirect accordingly.
 */
async function loginTeam(req, res) {
  try {
    const { teamName, password } = req.body

    if (!teamName || typeof teamName !== 'string' || teamName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Username / Team name is required.' })
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Password is required.' })
    }

    // ── Check admin first ──────────────────────────────────────────────────
    const admin = await Admin.findOne({ username: teamName.trim() })
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password)
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' })

      const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' })
      return res.status(200).json({
        success: true,
        message: 'Admin login successful!',
        token,
        role: 'admin',
        data: { id: admin._id, username: admin.username, role: 'admin' },
      })
    }

    // ── Check team ─────────────────────────────────────────────────────────
    const team = await Team.findOne({ teamName: teamName.trim() })
    if (!team) return res.status(401).json({ success: false, message: 'Invalid team name or password.' })

    const isMatch = await bcrypt.compare(password, team.password)
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid team name or password.' })

    const token = generateToken(team._id)
    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      role: 'team',
      data: {
        id: team._id,
        teamName: team.teamName,
        members: team.members,
        cineCoins: team.cineCoins,
        currentQuestionIndex: team.currentQuestionIndex,
        decodedWords: team.decodedWords,
        questionSetNumber: team.questionSetNumber,
        isCompleted: team.isCompleted,
        isDisqualified: team.isDisqualified,
        disqualificationReason: team.disqualificationReason,
      },
    })
  } catch (err) {
    console.error('Login error:', err.message)
    const isDbDisconnected = mongoose.connection.readyState !== 1
    return res.status(500).json({
      success: false,
      message: isDbDisconnected
        ? 'Database connection error: Could not reach MongoDB Atlas. Please ensure your IP is whitelisted in MongoDB Atlas Network Access.'
        : 'Server error. Please try again.',
    })
  }
}

/**
 * GET /api/auth/me  (protected — team only)
 */
async function getMe(req, res) {
  try {
    const team = req.team
    return res.status(200).json({
      success: true,
      data: {
        id: team._id,
        teamName: team.teamName,
        members: team.members,
        cineCoins: team.cineCoins,
        currentQuestionIndex: team.currentQuestionIndex,
        decodedWords: team.decodedWords,
        questionSetNumber: team.questionSetNumber,
        isCompleted: team.isCompleted,
        isDisqualified: team.isDisqualified,
        disqualificationReason: team.disqualificationReason,
      },
    })
  } catch (err) {
    console.error('GetMe error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { registerTeam, loginTeam, getMe }

const bcrypt = require('bcryptjs')
const Team = require('../models/Team')
const Question = require('../models/Question')
const EventState = require('../models/EventState')
const { normalizeDurationMinutes } = require('../utils/eventTiming')

// ─── Teams ───────────────────────────────────────────────────────────────────

async function getAllTeams(req, res) {
  try {
    const teams = await Team.find().select('-password -transactions').sort({ currentQuestionIndex: -1, cineCoins: -1 })
    return res.status(200).json({ success: true, data: teams })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

async function adjustCoins(req, res) {
  try {
    const { amount } = req.body
    if (amount === undefined) return res.status(400).json({ success: false, message: 'amount is required.' })
    const team = await Team.findById(req.params.id)
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' })
    team.cineCoins = Math.max(0, team.cineCoins + Number(amount))
    team.transactions.push({ amount: Number(amount), type: amount >= 0 ? 'REWARD' : 'PENALTY', description: `Manual adjustment by admin` })
    await team.save()
    return res.status(200).json({ success: true, cineCoins: team.cineCoins })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

async function deleteTeam(req, res) {
  try {
    const team = await Team.findByIdAndDelete(req.params.id)
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' })
    return res.status(200).json({ success: true, message: 'Team deleted.' })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

async function clearDisqualification(req, res) {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { isDisqualified: false, disqualifiedAt: null, disqualificationReason: null },
      { new: true },
    )
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' })
    return res.status(200).json({ success: true, message: 'Team reinstated.', data: team })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

// ─── Questions ────────────────────────────────────────────────────────────────

async function getAllQuestions(req, res) {
  try {
    const questions = (await Question.find().sort({ setNumber: 1, sequence: 1, questionNumber: 1 })).map((question) => {
      const data = question.toObject()
      return { ...data, setNumber: data.setNumber ?? 1, sequence: data.sequence ?? data.questionNumber }
    })
    const sets = await Question.aggregate([
      { $group: { _id: { $ifNull: ['$setNumber', 1] }, count: { $sum: 1 }, words: { $push: '$decodedWord' } } },
      { $sort: { _id: 1 } },
    ])
    return res.status(200).json({ success: true, data: questions, sets, totalQuestions: questions.length, requiredPerSet: 10 })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

async function createQuestion(req, res) {
  try {
    const payload = { ...req.body, setNumber: Number(req.body.setNumber ?? 1), sequence: Number(req.body.sequence) }
    if (!Number.isInteger(payload.setNumber) || payload.setNumber < 1 || !Number.isInteger(payload.sequence) || payload.sequence < 1 || payload.sequence > 10) {
      return res.status(400).json({ success: false, message: 'Set number must be positive and sequence must be between 1 and 10.' })
    }
    const setCount = await Question.countDocuments({ setNumber: payload.setNumber })
    if (setCount >= 10) return res.status(400).json({ success: false, message: `Set ${payload.setNumber} already has 10 questions.` })
    if (await Question.exists({ setNumber: payload.setNumber, sequence: payload.sequence })) {
      return res.status(400).json({ success: false, message: `Set ${payload.setNumber} already uses sequence ${payload.sequence}.` })
    }
    const q = await Question.create(payload)
    return res.status(201).json({ success: true, data: q })
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Question number already exists.' })
    return res.status(400).json({ success: false, message: err.message })
  }
}

async function updateQuestion(req, res) {
  try {
    const existing = await Question.findById(req.params.id)
    if (!existing) return res.status(404).json({ success: false, message: 'Question not found.' })
    const payload = { ...req.body, setNumber: Number(req.body.setNumber ?? existing.setNumber ?? 1), sequence: Number(req.body.sequence ?? existing.sequence) }
    if (await Question.exists({ _id: { $ne: req.params.id }, setNumber: payload.setNumber, sequence: payload.sequence })) {
      return res.status(400).json({ success: false, message: `Set ${payload.setNumber} already uses sequence ${payload.sequence}.` })
    }
    const q = await Question.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
    return res.status(200).json({ success: true, data: q })
  } catch (err) { return res.status(400).json({ success: false, message: err.message }) }
}

async function deleteQuestion(req, res) {
  try {
    const q = await Question.findByIdAndDelete(req.params.id)
    if (!q) return res.status(404).json({ success: false, message: 'Question not found.' })
    return res.status(200).json({ success: true, message: 'Question deleted.' })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

// ─── Event ────────────────────────────────────────────────────────────────────

async function getEventStatus(req, res) {
  try {
    let ev = await EventState.findOne()
    if (!ev) ev = await EventState.create({})
    if (ev.status === 'ACTIVE' && ev.startTime) {
      const endTime = ev.startTime.getTime() + (ev.durationMinutes ?? 60) * 60 * 1000
      if (Date.now() >= endTime) {
        ev.status = 'ENDED'
        await ev.save()
      }
    }
    return res.status(200).json({ success: true, data: ev })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

async function setEventStatus(req, res) {
  try {
    const { status, durationMinutes } = req.body
    const valid = ['NOT_STARTED', 'ACTIVE', 'PAUSED', 'ENDED']
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: `status must be one of: ${valid.join(', ')}` })

    let ev = await EventState.findOne()
    if (!ev) ev = new EventState()

    if (durationMinutes !== undefined) {
      ev.durationMinutes = normalizeDurationMinutes(durationMinutes, ev.durationMinutes ?? 60)
    }

    if (status === 'ACTIVE') {
      const completeSets = await Question.aggregate([
        { $group: { _id: { $ifNull: ['$setNumber', 1] }, count: { $sum: 1 } } },
        { $match: { count: { $gte: 10 } } },
      ])
      if (!completeSets.length) return res.status(400).json({ success: false, message: 'Cannot start yet. Add 10 questions to at least one set.' })
    }

    if (status === 'NOT_STARTED') {
      ev.startTime = null
    }
    const wasEnded = ev.status === 'ENDED'
    ev.status = status
    if (status === 'ACTIVE' && (!ev.startTime || wasEnded)) {
      ev.startTime = new Date()
    }
    await ev.save()
    return res.status(200).json({ success: true, data: ev })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

async function getLeaderboard(req, res) {
  try {
    const teams = await Team.find()
      .select('teamName currentQuestionIndex cineCoins isCompleted completedAt decodedWords members questionSetNumber isDisqualified')
      .sort({ currentQuestionIndex: -1, cineCoins: -1 })

    const ranked = teams.map((t, i) => ({
      rank: i + 1,
      teamName: t.teamName,
      members: t.members,
      currentQuestionIndex: t.currentQuestionIndex,
      cineCoins: t.cineCoins,
      wordsDecoded: t.decodedWords.length,
      isCompleted: t.isCompleted,
      completedAt: t.completedAt,
    }))

    return res.status(200).json({ success: true, data: ranked })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

module.exports = { getAllTeams, adjustCoins, deleteTeam, clearDisqualification, getAllQuestions, createQuestion, updateQuestion, deleteQuestion, getEventStatus, setEventStatus, getLeaderboard }

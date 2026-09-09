const Question = require('../models/Question')
const Team = require('../models/Team')
const EventState = require('../models/EventState')
const QuestionSetCounter = require('../models/QuestionSetCounter')

// ─── COIN ECONOMY ────────────────────────────────────────────────────────────
const COINS = {
  CORRECT:           +150,
  WRONG_FIRST:        -75,
  WRONG_REPEAT:      -100,
  HINT:              -150,
  SKIP:              -300,
  WRONG_BINARY:       -50,   // penalty per wrong binary decode attempt
  TAB_SWITCH:        -500,   // penalty for switching tabs / minimising window
}

// ─── helpers ────────────────────────────────────────────────────────────────

function safeQuestion(q) {
  return {
    id: q._id,
    questionNumber: q.questionNumber,
    title: q.title,
    description: q.description,
    codeSnippet: q.codeSnippet,
    options: q.options,
    hint: q.hint,
  }
}

function logTransaction(team, amount, type, description) {
  team.transactions.push({ amount, type, description })
  team.cineCoins = Math.max(0, team.cineCoins + amount)
}

async function getEventStatusValue() {
  const ev = await EventState.findOne()
  if (ev?.status === 'ACTIVE' && ev.startTime) {
    const endTime = ev.startTime.getTime() + (ev.durationMinutes ?? 60) * 60 * 1000
    if (Date.now() >= endTime) {
      ev.status = 'ENDED'
      await ev.save()
    }
  }
  return ev ? ev.status : 'NOT_STARTED'
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function ensureQuestionOrder(team) {
  if (team.questionOrder?.length === 10 && team.questionSetNumber) return

  const legacyQuestions = await Question.find({ setNumber: { $exists: false } }).sort({ questionNumber: 1 })
  if (legacyQuestions.length) {
    for (const [index, question] of legacyQuestions.entries()) {
      question.setNumber = 1
      question.sequence = index + 1
      await question.save()
    }
  }

  const setNumbers = await Question.distinct('setNumber')
  const completeSets = []
  for (const setNumber of setNumbers) {
    const count = await Question.countDocuments({ setNumber })
    if (count >= 10) completeSets.push(setNumber)
  }
  if (!completeSets.length) {
    const error = new Error('No complete question set is available. An admin must add 10 questions to a set.')
    error.statusCode = 409
    throw error
  }

  const usage = await Team.aggregate([
    { $match: { questionSetNumber: { $in: completeSets } } },
    { $group: { _id: '$questionSetNumber', count: { $sum: 1 } } },
  ])
  const counts = new Map(usage.map((item) => [item._id, item.count]))
  let selectedSet = completeSets.slice().sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0))[0]
  const leastUsedCount = counts.get(selectedSet) ?? 0

  // Once every prepared set has been assigned, create a new unique set for
  // the overflow team by cloning one complete story. This preserves its
  // meaningful sentence while giving the team independent question IDs.
  if (leastUsedCount > 0) {
    const sourceSet = completeSets[Math.floor(Math.random() * completeSets.length)]
    const sourceQuestions = await Question.find({ setNumber: sourceSet })
      .sort({ sequence: 1, questionNumber: 1 })
      .limit(10)
    const maxSet = await Question.findOne().sort({ setNumber: -1 }).select('setNumber')
    const maxQuestion = await Question.findOne().sort({ questionNumber: -1 }).select('questionNumber')
    const counter = await QuestionSetCounter.findOneAndUpdate(
      { key: 'question-library' },
      {
        $max: {
          nextSetNumber: (maxSet?.setNumber ?? 0) + 1,
          nextQuestionNumber: (maxQuestion?.questionNumber ?? 0) + 1,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    const allocated = await QuestionSetCounter.findOneAndUpdate(
      { key: 'question-library' },
      { $inc: { nextSetNumber: 1, nextQuestionNumber: 10 } },
      { new: true },
    )
    selectedSet = allocated.nextSetNumber - 1
    const firstQuestionNumber = allocated.nextQuestionNumber - 10
    await Question.insertMany(sourceQuestions.map((question, index) => ({
      setNumber: selectedSet,
      sequence: question.sequence ?? index + 1,
      questionNumber: firstQuestionNumber + index,
      title: question.title,
      description: question.description,
      codeSnippet: question.codeSnippet,
      options: question.options,
      correctOptionIndex: question.correctOptionIndex,
      hint: question.hint,
      binaryClue: question.binaryClue,
      decodedWord: question.decodedWord,
    })))
  }

  const questions = await Question.find({ setNumber: selectedSet })
    .sort({ sequence: 1, questionNumber: 1 })
    .limit(10)
    .select('questionNumber')

  team.questionSetNumber = selectedSet
  team.questionOrder = questions.map(q => q.questionNumber)
  await team.save()
}

function getTeamQuestionNumber(team) {
  return team.questionOrder[team.currentQuestionIndex]
}

// ─── GET /api/questions/current ──────────────────────────────────────────────

async function getCurrentQuestion(req, res) {
  try {
    const status = await getEventStatusValue()
    if (status !== 'ACTIVE' && status !== 'PAUSED') {
      return res.status(403).json({ success: false, message: `Event is ${status}. Questions are locked until the admin starts the event.` })
    }

    const team = await Team.findById(req.team._id)
    if (team.isDisqualified) return res.status(403).json({ success: false, disqualified: true, message: 'This team is disqualified from the test.' })
    await ensureQuestionOrder(team)

    const totalQuestions = team.questionOrder.length
    if (team.isCompleted || team.currentQuestionIndex >= totalQuestions) {
      return res.status(200).json({ success: true, finished: true, message: 'You have completed all questions!', data: null })
    }

    const question = await Question.findOne({ questionNumber: getTeamQuestionNumber(team) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' })

    return res.status(200).json({
      success: true,
      finished: false,
      data: safeQuestion(question),
      binaryClue: team.isAwaitingDecode ? question.binaryClue : null,
      teamState: {
        currentQuestionIndex: team.currentQuestionIndex,
        cineCoins: team.cineCoins,
        decodedWords: team.decodedWords,
        questionSetNumber: team.questionSetNumber,
        totalQuestions,
        wrongAttempts: team.wrongAttempts ?? 0,
        isAwaitingDecode: team.isAwaitingDecode ?? false,
      },
    })
  } catch (err) {
    console.error('getCurrentQuestion error:', err.message)
    return res.status(err.statusCode ?? 500).json({ success: false, message: err.statusCode ? err.message : 'Server error.' })
  }
}

// ─── POST /api/questions/answer ──────────────────────────────────────────────

async function submitAnswer(req, res) {
  try {
    const status = await getEventStatusValue()
    if (status !== 'ACTIVE') return res.status(403).json({ success: false, message: `Event is ${status}. Submissions are locked.` })

    const team = await Team.findById(req.team._id)
    if (team.isDisqualified) return res.status(403).json({ success: false, disqualified: true, message: 'This team is disqualified from the test.' })
    await ensureQuestionOrder(team)

    const { optionIndex } = req.body
    if (optionIndex === undefined || optionIndex === null) return res.status(400).json({ success: false, message: 'optionIndex is required.' })

    const question = await Question.findOne({ questionNumber: getTeamQuestionNumber(team) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' })

    const isCorrect = Number(optionIndex) === question.correctOptionIndex

    if (isCorrect) {
      // Reset wrong attempt counter for this question
      team.wrongAttempts = 0
      team.isAwaitingDecode = true
      logTransaction(team, COINS.CORRECT, 'REWARD', `Correct answer — Q${question.questionNumber} (+${COINS.CORRECT})`)
      await team.save()
      return res.status(200).json({
        success: true, isCorrect: true,
        message: `🎯 Correct! +${COINS.CORRECT} CineCoins`,
        cineCoins: team.cineCoins,
        binaryClue: question.binaryClue,
        questionNumber: question.questionNumber,
        coinChange: COINS.CORRECT,
      })
    } else {
      // Progressive penalty: first wrong = -75, subsequent = -100
      const attempts = team.wrongAttempts ?? 0
      const penalty = attempts === 0 ? COINS.WRONG_FIRST : COINS.WRONG_REPEAT
      team.wrongAttempts = attempts + 1
      logTransaction(team, penalty, 'PENALTY', `Wrong answer attempt ${attempts + 1} — Q${question.questionNumber} (${penalty})`)
      await team.save()
      return res.status(200).json({
        success: true, isCorrect: false,
        message: attempts === 0
          ? `✗ Wrong answer. ${Math.abs(penalty)} CineCoins deducted.`
          : `✗ Still wrong. ${Math.abs(penalty)} CineCoins deducted (attempt ${attempts + 1}).`,
        cineCoins: team.cineCoins,
        coinChange: penalty,
        attempts: team.wrongAttempts,
      })
    }
  } catch (err) {
    console.error('submitAnswer error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// ─── POST /api/questions/hint ────────────────────────────────────────────────

async function useHint(req, res) {
  try {
    const status = await getEventStatusValue()
    if (status !== 'ACTIVE') return res.status(403).json({ success: false, message: `Event is ${status}. Hints are locked.` })

    const team = await Team.findById(req.team._id)
    if (team.isDisqualified) return res.status(403).json({ success: false, disqualified: true, message: 'This team is disqualified from the test.' })
    await ensureQuestionOrder(team)

    if (team.cineCoins < Math.abs(COINS.HINT)) {
      return res.status(400).json({
        success: false,
        message: `Not enough CineCoins. Hint costs ${Math.abs(COINS.HINT)} coins — you have ${team.cineCoins}.`,
      })
    }

    const question = await Question.findOne({ questionNumber: getTeamQuestionNumber(team) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' })

    logTransaction(team, COINS.HINT, 'HINT', `Hint revealed — Q${question.questionNumber} (${COINS.HINT})`)
    await team.save()
    return res.status(200).json({
      success: true,
      hint: question.hint,
      cineCoins: team.cineCoins,
      coinChange: COINS.HINT,
      message: `💡 Hint revealed. ${Math.abs(COINS.HINT)} CineCoins deducted.`,
    })
  } catch (err) {
    console.error('useHint error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// ─── POST /api/questions/skip ────────────────────────────────────────────────

async function skipQuestion(req, res) {
  try {
    const status = await getEventStatusValue()
    if (status !== 'ACTIVE') return res.status(403).json({ success: false, message: `Event is ${status}. Skipping is locked.` })

    const team = await Team.findById(req.team._id)
    if (team.isDisqualified) return res.status(403).json({ success: false, disqualified: true, message: 'This team is disqualified from the test.' })
    await ensureQuestionOrder(team)

    if (team.cineCoins < Math.abs(COINS.SKIP)) {
      return res.status(400).json({
        success: false,
        message: `Not enough CineCoins. Skip costs ${Math.abs(COINS.SKIP)} coins — you have ${team.cineCoins}.`,
      })
    }

    const currentQNum = getTeamQuestionNumber(team)
    const question = await Question.findOne({ questionNumber: currentQNum })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' })

    logTransaction(team, COINS.SKIP, 'SKIP', `Skipped Q${currentQNum} (${COINS.SKIP})`)
    team.wrongAttempts = 0
    team.isAwaitingDecode = true
    await team.save()

    return res.status(200).json({
      success: true,
      message: `⏭ Question skipped. ${Math.abs(COINS.SKIP)} CineCoins deducted. Binary clue unlocked!`,
      cineCoins: team.cineCoins,
      coinChange: COINS.SKIP,
      binaryClue: question.binaryClue,
      questionNumber: question.questionNumber,
      currentQuestionIndex: team.currentQuestionIndex,
    })
  } catch (err) {
    console.error('skipQuestion error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// ─── POST /api/questions/verify-binary ──────────────────────────────────────

async function verifyBinary(req, res) {
  try {
    const status = await getEventStatusValue()
    if (status !== 'ACTIVE') return res.status(403).json({ success: false, message: `Event is ${status}. Submissions are locked.` })

    const team = await Team.findById(req.team._id)
    if (team.isDisqualified) return res.status(403).json({ success: false, disqualified: true, message: 'This team is disqualified from the test.' })
    await ensureQuestionOrder(team)

    const { word } = req.body
    if (!word || typeof word !== 'string') return res.status(400).json({ success: false, message: 'Decoded word is required.' })

    const question = await Question.findOne({ questionNumber: getTeamQuestionNumber(team) })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' })

    const isMatch = word.trim().toUpperCase() === question.decodedWord.toUpperCase()
    if (!isMatch) {
      // Penalise wrong binary decode
      logTransaction(team, COINS.WRONG_BINARY, 'PENALTY', `Wrong binary decode — Q${question.questionNumber} (${COINS.WRONG_BINARY})`)
      await team.save()
      return res.status(200).json({
        success: true, isMatch: false,
        message: `✗ Incorrect decode. ${Math.abs(COINS.WRONG_BINARY)} CineCoins deducted. Try again!`,
        cineCoins: team.cineCoins,
        coinChange: COINS.WRONG_BINARY,
      })
    }

    team.decodedWords.push(question.decodedWord)
    team.currentQuestionIndex += 1
    team.wrongAttempts = 0
    team.isAwaitingDecode = false

    const finished = team.currentQuestionIndex >= team.questionOrder.length
    if (finished) { team.isCompleted = true; team.completedAt = new Date() }
    await team.save()

    return res.status(200).json({
      success: true, isMatch: true,
      message: `✓ "${question.decodedWord}" decoded! ${finished ? 'All complete!' : 'Next question loading…'}`,
      decodedWords: team.decodedWords,
      currentQuestionIndex: team.currentQuestionIndex,
      cineCoins: team.cineCoins,
      finished,
      isCompleted: team.isCompleted,
      completedAt: team.completedAt,
      sentence: finished ? team.decodedWords.join(' ') : null,
    })
  } catch (err) {
    console.error('verifyBinary error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// ─── GET /api/team/transactions ──────────────────────────────────────────────

async function getTransactions(req, res) {
  try {
    const team = await Team.findById(req.team._id).select('transactions cineCoins')
    return res.status(200).json({ success: true, data: { cineCoins: team.cineCoins, transactions: team.transactions.slice().reverse() } })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// ─── GET /api/team/vault ─────────────────────────────────────────────────────

async function getVault(req, res) {
  try {
    const team = await Team.findById(req.team._id).select('decodedWords questionOrder isCompleted')
    const total = team.questionOrder?.length || 10
    return res.status(200).json({
      success: true,
      data: {
        decodedWords: team.decodedWords,
        unlocked: team.decodedWords.length,
        total,
        label: `${team.decodedWords.length}/${total} words unlocked`,
        isCompleted: team.isCompleted,
        sentence: team.isCompleted ? team.decodedWords.join(' ') : null,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

// ─── POST /api/questions/tab-switch ─────────────────────────────────────────
// Called by frontend when team switches tabs/windows during active event

async function reportTabSwitch(req, res) {
  try {
    const status = await getEventStatusValue()
    if (status !== 'ACTIVE') return res.status(200).json({ success: true, penalised: false, message: 'Event not active.' })

    const team = await Team.findById(req.team._id)
    if (team.isDisqualified) return res.status(200).json({ success: true, penalised: false, disqualified: true, message: 'This team is already disqualified.' })
    logTransaction(team, COINS.TAB_SWITCH, 'PENALTY', `Tab/window switch detected (${COINS.TAB_SWITCH})`)
    team.isDisqualified = true
    team.disqualifiedAt = new Date()
    team.disqualificationReason = 'Tab or window switch detected during the test.'
    await team.save()

    return res.status(200).json({
      success: true,
      penalised: true,
      coinChange: COINS.TAB_SWITCH,
      cineCoins: team.cineCoins,
      message: `⚠️ Tab switch detected! ${Math.abs(COINS.TAB_SWITCH)} CineCoins deducted.`,
      disqualified: true,
    })
  } catch (err) {
    console.error('reportTabSwitch error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { getCurrentQuestion, submitAnswer, useHint, skipQuestion, verifyBinary, getTransactions, getVault, reportTabSwitch }

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['REWARD', 'PENALTY', 'HINT', 'SKIP'], required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
})

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: [true, 'Team name is required'], unique: true, trim: true },
  members: {
    type: [String],
    validate: { validator(arr) { return arr.length >= 1 && arr.length <= 4 }, message: 'A team must have between 1 and 4 members' },
    required: [true, 'At least one member is required'],
  },
  password: { type: String, required: [true, 'Password is required'] },
  cineCoins: { type: Number, default: 1500 },
  currentQuestionIndex: { type: Number, default: 0 },
  decodedWords: { type: [String], default: [] },
  questionSetNumber: { type: Number, default: null },
  transactions: { type: [transactionSchema], default: [] },
  questionOrder: { type: [Number], default: [] },
  wrongAttempts: { type: Number, default: 0 }, // wrong attempts on current question
  isAwaitingDecode: { type: Boolean, default: false }, // whether current question is waiting for binary decode
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  isDisqualified: { type: Boolean, default: false },
  disqualifiedAt: { type: Date, default: null },
  disqualificationReason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
})

teamSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

const Team = mongoose.model('Team', teamSchema)
module.exports = Team

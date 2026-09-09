const mongoose = require('mongoose')

const questionSetCounterSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'question-library' },
  nextSetNumber: { type: Number, default: 1 },
  nextQuestionNumber: { type: Number, default: 1 },
})

module.exports = mongoose.model('QuestionSetCounter', questionSetCounterSchema)

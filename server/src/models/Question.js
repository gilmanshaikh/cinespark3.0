const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  setNumber: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  sequence: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
    max: 10,
  },
  questionNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  codeSnippet: {
    type: String,
    default: '',
  },
  options: {
    type: [String],
    required: true,
  },
  correctOptionIndex: {
    type: Number,
    required: true,
  },
  hint: {
    type: String,
    required: true,
  },
  binaryClue: {
    type: String,
    required: true,
  },
  decodedWord: {
    type: String,
    required: true,
  },
})

const Question = mongoose.model('Question', questionSchema)

module.exports = Question

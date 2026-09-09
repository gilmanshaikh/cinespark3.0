const mongoose = require('mongoose')

const eventStateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['NOT_STARTED', 'ACTIVE', 'PAUSED', 'ENDED'],
    default: 'NOT_STARTED',
  },
  startTime: { type: Date, default: null },
  durationMinutes: { type: Number, default: 60 },
})

// Singleton — always use the one document
const EventState = mongoose.model('EventState', eventStateSchema)
module.exports = EventState

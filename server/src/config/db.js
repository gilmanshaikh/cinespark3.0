const mongoose = require('mongoose')

const PLACEHOLDER_URI = 'your_mongodb_connection_string'

function isValidMongoUri(uri) {
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')
}

async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim()

  if (!uri || uri === PLACEHOLDER_URI) {
    console.warn(
      'MongoDB: No valid connection string configured. Set MONGODB_URI in server/.env when you are ready to connect.',
    )
    return
  }

  if (!isValidMongoUri(uri)) {
    console.error(
      'MongoDB connection error: MONGODB_URI must start with "mongodb://" or "mongodb+srv://"',
    )
    console.error('Server will continue running without an active database connection.')
    return
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    console.error('Server will continue running without an active database connection.')
  }
}

module.exports = connectDB

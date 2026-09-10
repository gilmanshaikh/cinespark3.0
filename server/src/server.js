require('dotenv').config()

const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const apiRoutes = require('./routes')
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://13.48.59.24'
const ALLOWED_ORIGINS = new Set([
  CLIENT_URL,
  'http://13.48.59.24',
  'http://13.48.59.24:80',
  'http://13.48.59.24:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
])

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true)
      return callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
  }),
)
app.use(express.json())

app.use('/api', apiRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(PORT)

server.on('listening', () => {
  console.log(`CineSpark 3.0 API listening on port ${PORT}`)
  void connectDB()
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Close the other server on this port, then run npm run dev again.`,
    )
  } else {
    console.error('Failed to start server:', error.message)
  }
  process.exit(1)
})

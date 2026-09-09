function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err.message)

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Team name is already taken. Please choose a different name.',
    })
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({
      success: false,
      message: messages.join(' '),
    })
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
}

module.exports = { notFoundHandler, errorHandler }

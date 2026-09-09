function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: 'CineSpark 3.0 API is running',
  })
}

module.exports = {
  getHealth,
}

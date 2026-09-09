const jwt = require('jsonwebtoken')

/**
 * Generate a signed JWT for a team.
 * @param {string} teamId - MongoDB _id of the team
 * @returns {string} signed JWT
 */
function generateToken(teamId) {
  return jwt.sign({ id: teamId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

module.exports = generateToken

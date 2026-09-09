const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

async function protectAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Not authorised. No token provided.' })

    const token = authHeader.split(' ')[1]
    let decoded
    try { decoded = jwt.verify(token, process.env.JWT_SECRET) } catch { return res.status(401).json({ success: false, message: 'Token invalid or expired.' }) }

    if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied. Admins only.' })

    const admin = await Admin.findById(decoded.id).select('-password')
    if (!admin) return res.status(401).json({ success: false, message: 'Admin not found.' })

    req.admin = admin
    next()
  } catch (err) {
    console.error('adminMiddleware error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { protectAdmin }

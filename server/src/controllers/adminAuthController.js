const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

async function adminLogin(req, res) {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password are required.' })

    const admin = await Admin.findOne({ username: username.trim() })
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials.' })

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' })

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' })
    return res.status(200).json({ success: true, token, data: { id: admin._id, username: admin.username, role: admin.role } })
  } catch (err) {
    console.error('adminLogin error:', err.message)
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

async function getAdminMe(req, res) {
  try {
    return res.status(200).json({ success: true, data: { id: req.admin._id, username: req.admin.username, role: req.admin.role } })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

module.exports = { adminLogin, getAdminMe }

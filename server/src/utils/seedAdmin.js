require('dotenv').config()
const mongoose = require('mongoose')
const Admin = require('../models/Admin')

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected for admin seeding...')

    await Admin.deleteMany({})
    await Admin.create({ username: 'admin', password: 'admin123' })
    console.log('✓ Admin created: username=admin  password=admin123')

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('seedAdmin error:', err.message)
    process.exit(1)
  }
}

seed()

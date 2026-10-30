require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const admins = await User.find({ role: 'admin' })
      .select('name email role isActive');

    if (admins.length === 0) {
      console.log('No admin users found in database.');
    } else {
      console.log('Admin accounts:', admins);
    }
  } catch (error) {
    console.error('Check failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function resetAdminPassword() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Missing required environment variables');
  }

  await mongoose.connect(MONGO_URI);

  const user = await User.findOne({
    email: ADMIN_EMAIL.toLowerCase(),
  }).select('+password');

  if (!user) {
    console.log('Admin user not found. Run the seed command first.');
    return;
  }

  if (user.role !== 'admin') {
    throw new Error('The specified account is not an admin');
  }

  user.password = ADMIN_PASSWORD;
  await user.save();

  console.log('Admin password updated successfully.');
}

resetAdminPassword()
  .catch((error) => {
    console.error('Password reset failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
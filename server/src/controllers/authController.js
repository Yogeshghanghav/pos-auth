const jwt = require('jsonwebtoken');
const User = require('../models/User');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAMESITE || 'strict',
});
const EIGHT_HOURS = 8 * 60 * 60 * 1000;

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Same message for unknown email and wrong password (prevents user enumeration)
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'Your account has been deactivated. Contact an admin.' });
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie('token', token, { ...cookieOptions(), maxAge: EIGHT_HOURS }).json({ user });
};

exports.logout = (_req, res) => {
  res.clearCookie('token', cookieOptions()).json({ message: 'Logged out' });
};

exports.me = (req, res) => res.json({ user: req.user });

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the cookie AND re-checks the DB, so deactivation applies immediately.
exports.authenticate = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account is inactive or not found' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' });
  }
};

exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to perform this action' });

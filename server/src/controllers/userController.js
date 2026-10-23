const User = require('../models/User');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.list = async (req, res) => {
  const search = String(req.query.search || '');
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const rx = search ? new RegExp(escapeRegex(search), 'i') : null;
  const q = rx ? { $or: [{ name: rx }, { email: rx }] } : {};

  const [users, total] = await Promise.all([
    User.find(q).sort('-createdAt').skip((page - 1) * limit).limit(limit),
    User.countDocuments(q),
  ]);
  res.json({ users, total, page, limit });
};

exports.create = async (req, res) => {
  if (await User.exists({ email: req.body.email.toLowerCase() })) {
    return res.status(409).json({ message: 'Email already in use' });
  }
  const user = await User.create(req.body);
  res.status(201).json({ user });
};

exports.update = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (req.params.id === req.user.id && req.body.role && req.body.role !== 'admin') {
    return res.status(400).json({ message: 'You cannot remove your own admin role' });
  }
  if (req.body.email && req.body.email.toLowerCase() !== user.email) {
    if (await User.exists({ email: req.body.email.toLowerCase() })) {
      return res.status(409).json({ message: 'Email already in use' });
    }
  }
  Object.assign(user, req.body); // password re-hashed by pre-save hook
  await user.save();
  res.json({ user });
};

exports.setStatus = async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
};

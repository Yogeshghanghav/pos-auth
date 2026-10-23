// Logs only method, path and message. Never the body, headers or cookies.
module.exports = (err, req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'Email already in use' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  if (process.env.NODE_ENV !== 'test') console.error(`${req.method} ${req.path}: ${err.message}`);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
};

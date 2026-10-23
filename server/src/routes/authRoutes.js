const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/authController');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' },
});

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Enter a valid email'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

router.post('/login', loginLimiter, validate(loginSchema), c.login);
router.post('/logout', authenticate, c.logout);
router.get('/me', authenticate, c.me);

module.exports = router;

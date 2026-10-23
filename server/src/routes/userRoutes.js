const router = require('express').Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const c = require('../controllers/userController');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/[0-9]/, 'Password needs a number');
const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(80);
const email = z.string().email('Enter a valid email');
const role = z.enum(['admin', 'staff'], { errorMap: () => ({ message: 'Role must be admin or staff' }) });

const createSchema = z.object({ name, email, password, role: role.default('staff') });
const updateSchema = z
  .object({ name: name.optional(), email: email.optional(), role: role.optional(), password: password.optional() })
  .strict();
const statusSchema = z.object({ isActive: z.boolean({ required_error: 'isActive is required' }) });

router.use(authenticate, authorize('admin')); // enforced on the server
router.get('/', c.list);
router.post('/', validate(createSchema), c.create);
router.put('/:id', validate(updateSchema), c.update);
router.patch('/:id/status', validate(statusSchema), c.setStatus);

module.exports = router;

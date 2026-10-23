require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authenticate, authorize } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const pos = require('./routes/posRoutes');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Existing POS APIs, now protected
app.use('/api/products', authenticate, pos.products);
app.use('/api/sales', authenticate, pos.sales);
app.use('/api/reports', authenticate, authorize('admin'), pos.reports);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;

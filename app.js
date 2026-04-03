const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const transactionRoutes = require('./src/routes/transaction.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

const app = express();

// Reverse-proxy hosts (Render, etc.) need trust proxy enabled so
// express-rate-limit can resolve the real client IP from X-Forwarded-For.
const trustProxyEnv = (process.env.TRUST_PROXY || '').trim().toLowerCase();
if (trustProxyEnv) {
  if (trustProxyEnv === 'true') {
    app.set('trust proxy', 1);
  } else if (trustProxyEnv === 'false') {
    app.set('trust proxy', false);
  } else if (!Number.isNaN(Number(trustProxyEnv))) {
    app.set('trust proxy', Number(trustProxyEnv));
  }
} else if (process.env.RENDER === 'true' || process.env.RENDER_EXTERNAL_URL) {
  app.set('trust proxy', 1);
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting configurable via RATE_LIMIT_MAX.
// In test runs, default is intentionally kept high to avoid cross-suite interference.
const defaultRateLimit = process.env.NODE_ENV === 'test' ? 10000 : 100;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || defaultRateLimit),
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${status}] ${message}`);
  }
  res.status(status).json({ success: false, message });
});

module.exports = app;

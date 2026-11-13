const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean);
let dbConnection;

app.use(helmet());
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(null, false);
} }));
app.use(express.json({ limit: '30kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));

app.get('/health', (_req, res) => res.json({ name: 'KIDS EDUVERSE API', status: 'running' }));

async function ensureDatabase(_req, res, next) {
  if (mongoose.connection.readyState === 1) return next();
  if (!dbConnection) {
    dbConnection = connectDB().catch(err => {
      dbConnection = null;
      throw err;
    });
  }
  try {
    await dbConnection;
    next();
  } catch (err) {
    console.error('Could not connect to MongoDB:', err.message);
    res.status(503).json({ message: 'Database unavailable.' });
  }
}

app.use('/api', (req, res, next) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'replace_this_with_a_long_random_secret') {
    return res.status(503).json({ message: 'Server authentication is not configured.' });
  }
  next();
});
app.use('/api', ensureDatabase, require('./routes'));

// Local development serves the source frontend here. Vercel serves the built public/ files itself.
app.use(express.static(path.resolve(__dirname, '../KIDS-EDUVERSE-Final')));
app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Server error.' : err.message || 'Request failed.' });
});

module.exports = app;

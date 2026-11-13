require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(helmet());
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(null, false);
} }));
app.use(express.json({ limit: '30kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.use('/api', require('./routes'));

app.get('/health', (_req, res) => res.json({ name: 'KIDS EDUVERSE API', status: 'running' }));
app.use(express.static(path.resolve(__dirname, '../KIDS-EDUVERSE-Final')));
app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error.' });
});

const PORT = process.env.PORT || 5000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'replace_this_with_a_long_random_secret') {
  console.error('JWT_SECRET must be set to a random value at least 32 characters long.');
  process.exit(1);
}
connectDB().then(() => app.listen(PORT, () => console.log(`KIDS EDUVERSE API running on port ${PORT}`)))
  .catch(err => { console.error('Could not connect to MongoDB:', err.message); process.exit(1); });

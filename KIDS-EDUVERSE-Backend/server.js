require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

function hasValidJwtSecret() {
  return process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32 &&
    process.env.JWT_SECRET !== 'replace_this_with_a_long_random_secret';
}

if (require.main === module) {
  if (!hasValidJwtSecret()) {
    console.error('JWT_SECRET must be set to a random value at least 32 characters long.');
    process.exit(1);
  }
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => app.listen(PORT, () => console.log(`KIDS EDUVERSE API running on port ${PORT}`)))
    .catch(err => { console.error('Could not connect to MongoDB:', err.message); process.exit(1); });
}

module.exports = app;

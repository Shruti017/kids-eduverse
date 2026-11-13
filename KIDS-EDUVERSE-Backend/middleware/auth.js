const jwt = require('jsonwebtoken');
const User = require('../models/User');
module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Please log in first.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('_id name email');
    if (!user) return res.status(401).json({ message: 'Account not found.' });
    req.user = user;
    next();
  } catch (_err) { res.status(401).json({ message: 'Your session is invalid or has expired.' }); }
};

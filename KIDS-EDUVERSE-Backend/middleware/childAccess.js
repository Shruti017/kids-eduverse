const Child = require('../models/Child');
module.exports = async function childAccess(req, res, next) {
  try {
    const child = await Child.findOne({ _id: req.params.childId, parent: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child profile not found.' });
    req.child = child;
    next();
  } catch (_err) { res.status(400).json({ message: 'Invalid child ID.' }); }
};

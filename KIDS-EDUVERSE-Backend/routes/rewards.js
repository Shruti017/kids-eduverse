const router = require('express').Router();
const auth = require('../middleware/auth');
const childAccess = require('../middleware/childAccess');
const Child = require('../models/Child');
const Result = require('../models/Result');
router.use(auth);
router.get('/:childId', childAccess, async (req, res, next) => {
  try {
    const totalResults = await Result.countDocuments({ child: req.child._id });
    const quizCount = await Result.countDocuments({ child: req.child._id, type: 'quiz' });
    const gameCount = await Result.countDocuments({ child: req.child._id, type: 'game' });
    res.json({ xp: req.child.xp, level: Math.floor(req.child.xp / 100) + 1,
      badges: req.child.badges, totalResults, quizCount, gameCount });
  } catch (err) { next(err); }
});
router.post('/:childId/badges', childAccess, async (req, res, next) => {
  try {
    const badge = String(req.body.badge || '').trim().slice(0, 50);
    if (!badge) return res.status(400).json({ message: 'Badge name is required.' });
    const child = await Child.findByIdAndUpdate(req.child._id, { $addToSet: { badges: badge } }, { new: true });
    res.json({ xp: child.xp, badges: child.badges });
  } catch (err) { next(err); }
});
module.exports = router;

const router = require('express').Router();
const auth = require('../middleware/auth');
const childAccess = require('../middleware/childAccess');
const Progress = require('../models/Progress');
router.use(auth);
router.get('/:childId', childAccess, async (req, res, next) => {
  try {
    const progress = await Progress.find({ child: req.child._id }).sort({ updatedAt: -1 });
    res.json({ progress });
  } catch (err) { next(err); }
});
router.post('/:childId', childAccess, async (req, res, next) => {
  try {
    const activity = String(req.body.activity || '').trim();
    if (!activity) return res.status(400).json({ message: 'Activity name is required.' });
    const score = Math.max(0, Math.min(100, Number(req.body.score) || 0));
    const update = {
      $set: { completed: Boolean(req.body.completed), lastPlayedAt: new Date() },
      $max: { bestScore: score },
      $inc: { attempts: 1 }
    };
    const progress = await Progress.findOneAndUpdate(
      { child: req.child._id, activity }, update, { new: true, upsert: true, runValidators: true }
    );
    res.json({ progress });
  } catch (err) { next(err); }
});
module.exports = router;

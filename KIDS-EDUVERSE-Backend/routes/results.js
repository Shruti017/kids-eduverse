const router = require('express').Router();
const auth = require('../middleware/auth');
const childAccess = require('../middleware/childAccess');
const Result = require('../models/Result');
const Progress = require('../models/Progress');
const Child = require('../models/Child');
router.use(auth);
router.post('/:childId', childAccess, async (req, res, next) => {
  try {
    const type = req.body.type;
    const activity = String(req.body.activity || '').trim();
    const score = Number(req.body.score);
    const total = req.body.total === undefined ? undefined : Number(req.body.total);
    if (!['quiz', 'game'].includes(type) || !activity || !Number.isFinite(score) || score < 0)
      return res.status(400).json({ message: 'Provide type (quiz/game), activity and a valid score.' });
    if (total !== undefined && (!Number.isFinite(total) || total < score))
      return res.status(400).json({ message: 'Total must be greater than or equal to score.' });
    const xpEarned = Math.min(50, Math.round(total ? (score / total) * 10 : score));
    const result = await Result.create({ child: req.child._id, type, activity, score, total, xpEarned });
    await Progress.findOneAndUpdate(
      { child: req.child._id, activity },
      { $set: { completed: true, lastPlayedAt: new Date() }, $max: { bestScore: score }, $inc: { attempts: 1 } },
      { upsert: true, new: true }
    );
    const child = await Child.findByIdAndUpdate(req.child._id, { $inc: { xp: xpEarned } }, { new: true });
    res.status(201).json({ result, rewards: { xpEarned, totalXP: child.xp } });
  } catch (err) { next(err); }
});
router.get('/:childId', childAccess, async (req, res, next) => {
  try {
    const results = await Result.find({ child: req.child._id }).sort({ createdAt: -1 }).limit(100);
    res.json({ results });
  } catch (err) { next(err); }
});
module.exports = router;

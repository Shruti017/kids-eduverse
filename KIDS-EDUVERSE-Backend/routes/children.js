const router = require('express').Router();
const auth = require('../middleware/auth');
const Child = require('../models/Child');
router.use(auth);
router.post('/', async (req, res, next) => {
  try {
    const nickname = String(req.body.nickname || '').trim();
    const age = req.body.age === undefined ? undefined : Number(req.body.age);
    if (!nickname) return res.status(400).json({ message: 'Child nickname is required.' });
    if (age !== undefined && (!Number.isInteger(age) || age < 3 || age > 12))
      return res.status(400).json({ message: 'Age must be between 3 and 12.' });
    const child = await Child.create({ parent: req.user._id, nickname, age });
    res.status(201).json({ child });
  } catch (err) { next(err); }
});
router.get('/', async (req, res, next) => {
  try { res.json({ children: await Child.find({ parent: req.user._id }).sort({ createdAt: -1 }) }); }
  catch (err) { next(err); }
});
router.delete('/:childId', async (req, res, next) => {
  try {
    const child = await Child.findOneAndDelete({ _id: req.params.childId, parent: req.user._id });
    if (!child) return res.status(404).json({ message: 'Child profile not found.' });
    const Progress = require('../models/Progress'), Result = require('../models/Result');
    await Promise.all([Progress.deleteMany({ child: child._id }), Result.deleteMany({ child: child._id })]);
    res.json({ message: 'Child profile and its learning records were deleted.' });
  } catch (err) { next(err); }
});
module.exports = router;

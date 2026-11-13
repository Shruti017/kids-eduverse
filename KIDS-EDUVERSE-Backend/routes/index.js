const router = require('express').Router();
router.use('/auth', require('./auth'));
router.use('/children', require('./children'));
router.use('/progress', require('./progress'));
router.use('/results', require('./results'));
router.use('/rewards', require('./rewards'));
module.exports = router;

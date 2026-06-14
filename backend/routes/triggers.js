const express = require('express');
const Trigger = require('../models/Trigger');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const trigger = await Trigger.findOne({ user: req.user._id });

    if (!trigger) return res.json({ triggers: null });

    const emotions = ['anger', 'sadness', 'fear', 'disgust'];
    const top3 = {};

    emotions.forEach(emotion => {
      top3[emotion] = (trigger.triggers[emotion] || []).slice(0, 3);
    });

    res.json({ triggers: top3 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
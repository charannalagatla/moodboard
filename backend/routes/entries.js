const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Entry = require('../models/Entry');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect); // all entry routes require auth

// ── Helper: call Flask ML service ────────────────────────────
async function analyseEmotion(text) {
  try {
    const response = await axios.post(
      `${process.env.FLASK_ML_URL}/analyse`,
      { text },
      { timeout: 15000 }
    );
    return response.data; // { dominant: { label, score }, emotions: [{label, score}] }
  } catch (err) {
    console.error('ML service error:', err.message);
    return null; // graceful fallback — save entry without ML result
  }
}

// ── Helper: generate simple insight ──────────────────────────
function generateInsight(emotion, score) {
  const insights = {
    joy: [
      "You're radiating positive energy today! Capture what's making you happy.",
      "Great day! Consider sharing your joy with someone you care about.",
    ],
    sadness: [
      "It's okay to feel sad. Writing about it is already a brave step.",
      "Tough moments pass. Be gentle with yourself today.",
    ],
    anger: [
      "Anger is valid — it often signals something important needs your attention.",
      "Try a 5-minute walk to release that tension before revisiting this.",
    ],
    fear: [
      "Fear shows you care about something. What's really behind this feeling?",
      "Name it to tame it — you've already started by writing it down.",
    ],
    surprise: [
      "Unexpected moments shake things up. How do you feel about it now?",
      "Life threw you a curveball! Take a breath and assess calmly.",
    ],
    disgust: [
      "Your values are signalling something feels wrong. Trust that intuition.",
      "Setting boundaries around what doesn't sit right is self-care.",
    ],
    neutral: [
      "A calm mind is a clear mind. Great time for planning or reflection.",
      "Steady days have value. Consistency builds streaks!",
    ],
  };

  const pool = insights[emotion] || insights['neutral'];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── POST /api/entries ─────────────────────────────────────────
router.post(
  '/',
  [
    body('text')
      .trim()
      .isLength({ min: 3, max: 5000 })
      .withMessage('Entry must be between 3 and 5000 characters'),
    body('moodTag').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { text, moodTag = '' } = req.body;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Call ML service
      const mlResult = await analyseEmotion(text);

      let dominantEmotion = null;
      let dominantScore = null;
      let emotions = [];
      let insight = null;

      if (mlResult) {
        dominantEmotion = mlResult.dominant.label;
        dominantScore = mlResult.dominant.score;
        emotions = mlResult.emotions;
        insight = generateInsight(dominantEmotion, dominantScore);
      }

      // Save entry
      const entry = await Entry.create({
        user: req.user._id,
        text,
        moodTag,
        dominantEmotion,
        dominantScore,
        emotions,
        insight,
        entryDate: today,
      });

      // Update user streak
      const user = await User.findById(req.user._id);
      user.updateStreak();
      await user.save();

      res.status(201).json({
        entry,
        streak: user.streak,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/entries ──────────────────────────────────────────
// Returns paginated list, newest first
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      Entry.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Entry.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/entries/dashboard ────────────────────────────────
// Aggregated mood data for charts (last 30 days)
router.get('/dashboard', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    // Group by day for the bar chart
    const dailyMoods = await Entry.aggregate([
      {
        $match: {
          user: req.user._id,
          entryDate: { $gte: fromDate },
          dominantEmotion: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$entryDate',
          topEmotion: { $first: '$dominantEmotion' },
          avgScore: { $avg: '$dominantScore' },
          count: { $sum: 1 },
          emotions: { $push: '$emotions' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Emotion frequency for the pie/bar chart
    const emotionFrequency = await Entry.aggregate([
      {
        $match: {
          user: req.user._id,
          dominantEmotion: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$dominantEmotion',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Last 7 days average score trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromWeek = sevenDaysAgo.toISOString().split('T')[0];

    const weekTrend = await Entry.aggregate([
      {
        $match: {
          user: req.user._id,
          entryDate: { $gte: fromWeek },
          dominantScore: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$entryDate',
          avgScore: { $avg: '$dominantScore' },
          dominantEmotion: { $first: '$dominantEmotion' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Detect pattern insights
    const patternInsights = detectPatterns(dailyMoods);

    res.json({
      dailyMoods,
      emotionFrequency,
      weekTrend,
      patternInsights,
    });
  } catch (err) {
    next(err);
  }
});

// ── Pattern detection ─────────────────────────────────────────
function detectPatterns(dailyMoods) {
  const insights = [];

  // Count emotions by day of week
  const dayOfWeekEmotion = {};
  dailyMoods.forEach(({ _id, topEmotion }) => {
    const day = new Date(_id).toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayOfWeekEmotion[day]) dayOfWeekEmotion[day] = {};
    dayOfWeekEmotion[day][topEmotion] = (dayOfWeekEmotion[day][topEmotion] || 0) + 1;
  });

  for (const [day, emotions] of Object.entries(dayOfWeekEmotion)) {
    const topEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];
    if (topEmotion && topEmotion[1] >= 2) {
      const emotionLabel = topEmotion[0];
      if (['sadness', 'anger', 'fear'].includes(emotionLabel)) {
        insights.push({
          type: 'pattern',
          icon: '📊',
          text: `You tend to feel ${emotionLabel} on ${day}s. Consider what might be causing this.`,
        });
      } else if (['joy', 'surprise'].includes(emotionLabel)) {
        insights.push({
          type: 'positive',
          icon: '✨',
          text: `${day}s seem to be your happiest days! Keep doing what's working.`,
        });
      }
    }
  }

  // Consecutive negative days warning
  let consecutiveNegative = 0;
  const negativeEmotions = ['sadness', 'anger', 'fear', 'disgust'];
  for (const { topEmotion } of dailyMoods.slice(-5)) {
    if (negativeEmotions.includes(topEmotion)) consecutiveNegative++;
    else break;
  }

  if (consecutiveNegative >= 3) {
    insights.push({
      type: 'care',
      icon: '💙',
      text: `You've had ${consecutiveNegative} tough days in a row. Remember to be kind to yourself.`,
    });
  }

  return insights.slice(0, 3); // max 3 insights
}

// ── GET /api/entries/:id ──────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const entry = await Entry.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ entry });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/entries/:id ───────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const entry = await Entry.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

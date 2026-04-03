const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Entry = require('../models/Entry');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── Gemini emotion analysis ───────────────────────────────────
async function analyseEmotion(text) {
  try {
    const prompt = `Read this journal entry and tell me how the person is feeling emotionally.

Journal entry: "${text.substring(0, 1000)}"

Respond ONLY with a JSON object, no explanation, no markdown:
{
  "dominant": { "label": "<emotion>", "score": <0.0 to 1.0> },
  "emotions": [
    { "label": "joy",      "score": <0.0 to 1.0> },
    { "label": "sadness",  "score": <0.0 to 1.0> },
    { "label": "anger",    "score": <0.0 to 1.0> },
    { "label": "fear",     "score": <0.0 to 1.0> },
    { "label": "surprise", "score": <0.0 to 1.0> },
    { "label": "disgust",  "score": <0.0 to 1.0> },
    { "label": "neutral",  "score": <0.0 to 1.0> }
  ]
}

All scores must sum to 1.0. dominant must be the highest scoring emotion.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      },
      { timeout: 15000 }
    );

    const raw = response.data.candidates[0].content.parts[0].text.trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);
    return result;
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return null;
  }
}

// ── Insight generator ─────────────────────────────────────────
function generateInsight(emotion) {
  const insights = {
    joy:      ["You're radiating positive energy today! Capture what's making you happy.", "Great day! Consider sharing your joy with someone you care about."],
    sadness:  ["It's okay to feel sad. Writing about it is already a brave step.", "Tough moments pass. Be gentle with yourself today."],
    anger:    ["Anger is valid — it often signals something important needs your attention.", "Try a 5-minute walk to release that tension before revisiting this."],
    fear:     ["Fear shows you care about something. What's really behind this feeling?", "Name it to tame it — you've already started by writing it down."],
    surprise: ["Unexpected moments shake things up. How do you feel about it now?", "Life threw you a curveball! Take a breath and assess calmly."],
    disgust:  ["Your values are signalling something feels wrong. Trust that intuition.", "Setting boundaries around what doesn't sit right is self-care."],
    neutral:  ["A calm mind is a clear mind. Great time for planning or reflection.", "Steady days have value. Consistency builds streaks!"],
  };
  const pool = insights[emotion] || insights['neutral'];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── POST /api/entries ─────────────────────────────────────────
router.post('/',
  [
    body('text').trim().isLength({ min: 3, max: 5000 }).withMessage('Entry must be between 3 and 5000 characters'),
    body('moodTag').optional().isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { text, moodTag = '' } = req.body;
      const today = new Date().toISOString().split('T')[0];

      const mlResult = await analyseEmotion(text);

      let dominantEmotion = null, dominantScore = null, emotions = [], insight = null;

      if (mlResult) {
        dominantEmotion = mlResult.dominant.label;
        dominantScore   = mlResult.dominant.score;
        emotions        = mlResult.emotions;
        insight         = generateInsight(dominantEmotion);
      }

      const entry = await Entry.create({ user: req.user._id, text, moodTag, dominantEmotion, dominantScore, emotions, insight, entryDate: today });

      const user = await User.findById(req.user._id);
      user.updateStreak();
      await user.save();

      res.status(201).json({ entry, streak: user.streak });
    } catch (err) { next(err); }
  }
);

// ── GET /api/entries ──────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      Entry.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
      Entry.countDocuments({ user: req.user._id }),
    ]);

    res.json({ entries, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// ── GET /api/entries/dashboard ────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    const dailyMoods = await Entry.aggregate([
      { $match: { user: req.user._id, entryDate: { $gte: fromDate }, dominantEmotion: { $ne: null } } },
      { $group: { _id: '$entryDate', topEmotion: { $first: '$dominantEmotion' }, avgScore: { $avg: '$dominantScore' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const emotionFrequency = await Entry.aggregate([
      { $match: { user: req.user._id, dominantEmotion: { $ne: null } } },
      { $group: { _id: '$dominantEmotion', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromWeek = sevenDaysAgo.toISOString().split('T')[0];

    const weekTrend = await Entry.aggregate([
      { $match: { user: req.user._id, entryDate: { $gte: fromWeek }, dominantScore: { $ne: null } } },
      { $group: { _id: '$entryDate', avgScore: { $avg: '$dominantScore' }, dominantEmotion: { $first: '$dominantEmotion' } } },
      { $sort: { _id: 1 } },
    ]);

    const patternInsights = detectPatterns(dailyMoods);
    res.json({ dailyMoods, emotionFrequency, weekTrend, patternInsights });
  } catch (err) { next(err); }
});

function detectPatterns(dailyMoods) {
  const insights = [];
  const dow = {};

  dailyMoods.forEach(({ _id, topEmotion }) => {
    const day = new Date(_id).toLocaleDateString('en-US', { weekday: 'long' });
    if (!dow[day]) dow[day] = {};
    dow[day][topEmotion] = (dow[day][topEmotion] || 0) + 1;
  });

  for (const [day, emotions] of Object.entries(dow)) {
    const top = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) {
      if (['sadness', 'anger', 'fear'].includes(top[0]))
        insights.push({ type: 'pattern', icon: '📊', text: `You tend to feel ${top[0]} on ${day}s. Consider what might be causing this.` });
      else if (['joy', 'surprise'].includes(top[0]))
        insights.push({ type: 'positive', icon: '✨', text: `${day}s seem to be your happiest days! Keep doing what's working.` });
    }
  }

  let neg = 0;
  for (const { topEmotion } of dailyMoods.slice(-5)) {
    if (['sadness', 'anger', 'fear', 'disgust'].includes(topEmotion)) neg++;
    else break;
  }
  if (neg >= 3) insights.push({ type: 'care', icon: '💙', text: `You've had ${neg} tough days in a row. Remember to be kind to yourself.` });

  return insights.slice(0, 3);
}

// ── GET /api/entries/:id ──────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ entry });
  } catch (err) { next(err); }
});

// ── DELETE /api/entries/:id ───────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const entry = await Entry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ message: 'Entry deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;

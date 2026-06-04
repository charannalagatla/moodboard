const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Entry = require('../models/Entry');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── Groq API emotion analysis ───────────────────────────────────
async function analyseEmotion(text) {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Read this journal entry and tell me how the person is feeling emotionally.

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
All scores must sum to 1.0. dominant must be the highest scoring emotion.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Groq API error:', err.message);
    return null;
  }
}

// ── AI Insight generator (replaces hardcoded strings) ────────
async function generateInsight(text, emotion) {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        temperature: 0.85,
        max_tokens: 120,
        messages: [
          {
            role: 'system',
            content: `You are a friendly journal companion talking to a college student.
Respond in simple, everyday English — like a friend texting back.
Maximum 2 sentences. Short words only. No formal language.
Be warm and genuine. No bullet points, no lists.
Never start with "I" or "It sounds like".`,
          },
          {
            role: 'user',
            content: `Journal entry: "${text.substring(0, 800)}"
Detected emotion: ${emotion}
Write a short personal response to this person.`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('Groq insight error:', err.message);
    // Fallback to simple hardcoded insight if API fails
    const fallback = {
      joy:      "That joy you're feeling? Hold onto it.",
      sadness:  "It takes courage to sit with these feelings. Be gentle with yourself.",
      anger:    "Your feelings are valid. Take a breath before deciding what to do next.",
      fear:     "You named it by writing it down. That's already brave.",
      surprise: "Life loves catching us off guard. Take a moment to process.",
      disgust:  "Trusting your instincts about what feels wrong is a form of self-respect.",
      neutral:  "Steady days build the foundation for everything else.",
    };
    return fallback[emotion] || fallback['neutral'];
  }
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
        // Run insight generation in parallel with nothing — or await directly
        insight = await generateInsight(text, dominantEmotion);
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

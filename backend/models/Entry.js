const mongoose = require('mongoose');

const emotionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

const entrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Entry text is required'],
      minlength: [3, 'Entry must be at least 3 characters'],
      maxlength: [5000, 'Entry cannot exceed 5000 characters'],
    },
    moodTag: {
      type: String,
      enum: ['happy', 'sad', 'anxious', 'angry', 'calm', 'excited', 'neutral', ''],
      default: '',
    },
    // ML results from HuggingFace
    dominantEmotion: { type: String, default: null },
    dominantScore: { type: Number, default: null },
    emotions: [emotionSchema], // all 7 emotion scores
    // Insight generated for this entry
    insight: { type: String, default: null },
    // Date for streak/dashboard grouping (date only, no time)
    entryDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index: user + date for dashboard queries
entrySchema.index({ user: 1, entryDate: -1 });
entrySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Entry', entrySchema);

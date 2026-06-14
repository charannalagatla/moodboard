const mongoose = require('mongoose');

const triggerWordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true },
    count: { type: Number, default: 1 },
  },
  { _id: false }
);

const triggerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    triggers: {
      anger:   { type: [triggerWordSchema], default: [] },
      sadness: { type: [triggerWordSchema], default: [] },
      fear:    { type: [triggerWordSchema], default: [] },
      disgust: { type: [triggerWordSchema], default: [] },
    },
    updatedAt: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model('Trigger', triggerSchema);
const mongoose = require('mongoose');
const progressSchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
  activity: { type: String, required: true, trim: true, maxlength: 80 },
  completed: { type: Boolean, default: false },
  bestScore: { type: Number, default: 0, min: 0 },
  attempts: { type: Number, default: 0, min: 0 },
  lastPlayedAt: { type: Date, default: Date.now }
}, { timestamps: true });
progressSchema.index({ child: 1, activity: 1 }, { unique: true });
module.exports = mongoose.model('Progress', progressSchema);

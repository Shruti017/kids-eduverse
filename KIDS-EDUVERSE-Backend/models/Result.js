const mongoose = require('mongoose');
const resultSchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true, index: true },
  type: { type: String, enum: ['quiz', 'game'], required: true },
  activity: { type: String, required: true, maxlength: 80 },
  score: { type: Number, required: true, min: 0 },
  total: { type: Number, min: 0 },
  xpEarned: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Result', resultSchema);

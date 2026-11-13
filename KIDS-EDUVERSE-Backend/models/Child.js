const mongoose = require('mongoose');
const childSchema = new mongoose.Schema({
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  nickname: { type: String, required: true, trim: true, minlength: 1, maxlength: 30 },
  age: { type: Number, min: 3, max: 12 },
  xp: { type: Number, default: 0, min: 0 },
  badges: { type: [String], default: [] }
}, { timestamps: true });
module.exports = mongoose.model('Child', childSchema);

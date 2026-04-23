const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = global/default category
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  emoji: {
    type: String,
    default: '📦',
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'both'],
    default: 'both',
  },
  color: {
    type: String,
    default: '#10b981',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);

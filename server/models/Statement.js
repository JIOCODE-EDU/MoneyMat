const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileSize: Number,
  mimeType: String,
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  },
  totalRecords: {
    type: Number,
    default: 0,
  },
  importedRecords: {
    type: Number,
    default: 0,
  },
  skippedRecords: {
    type: Number,
    default: 0,
  },
  totalIncome: {
    type: Number,
    default: 0,
  },
  totalExpense: {
    type: Number,
    default: 0,
  },
  parsingErrors: [{
    row: Number,
    message: String,
  }],
  parsedData: [{
    description: String,
    amount: Number,
    type: String,
    category: String,
    date: Date,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Statement', statementSchema);

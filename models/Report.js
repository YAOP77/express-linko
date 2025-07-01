const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  treated: { type: Boolean, default: false }
});

module.exports = mongoose.model('Report', ReportSchema); 
const mongoose = require('mongoose');

const ChatRoomSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  message: { type: String, required: true },
  timestamp: { type: String, required: true },
  type: { type: String, enum: ['text', 'media', 'group'], default: 'text' },
  mediaType: { type: String, enum: ['image', 'video'], required: false },
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
}, { timestamps: true });

module.exports = mongoose.model('chatroom', ChatRoomSchema); 
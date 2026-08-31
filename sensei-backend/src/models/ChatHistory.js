import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages:   [{
    role:      { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content:   { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

chatHistorySchema.index({ studentId: 1 }, { unique: true });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;

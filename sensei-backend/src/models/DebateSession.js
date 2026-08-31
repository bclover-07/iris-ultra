import mongoose from 'mongoose';

const debateSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  aiPersonality: { type: String, required: true },
  debateMode: { type: String, required: true },
  side: { type: String, enum: ['pro', 'con'], default: 'pro' },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  finalScores: {
    logic: Number,
    confidence: Number,
    clarity: Number,
    emotionalControl: Number,
    persuasion: Number,
    diplomacy: Number,
    overall: Number
  },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'DebateReport' },
  xpEarned: { type: Number, default: 0 }
});

const DebateSession = mongoose.model('DebateSession', debateSessionSchema);
export default DebateSession;

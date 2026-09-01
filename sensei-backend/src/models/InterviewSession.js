import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  sessionId:    { type: String, required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain:       { type: String, default: 'General Software Engineering' },
  jobRole:      { type: String, default: 'Software Engineer' },
  company:      { type: String, default: 'Tech Industry' },
  mode:         { type: String, default: 'technical' },
  difficulty:   { type: String, default: 'Intermediate' },
  status:       { type: String, enum: ['active', 'in_progress', 'completed', 'abandoned'], default: 'in_progress' },
  startedAt:    { type: Date, default: Date.now },
  endedAt:      { type: Date },
  turns:        [{
    turnIndex:     { type: Number },
    question:      { type: String },
    answer:        { type: String },
    score:         { type: Number },
    feedback:      { type: String },
    eyeContact:    { type: Number, default: 90 },
    headStability: { type: Number, default: 92 }
  }],
  finalScores:  {
    technical:     { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence:    { type: Number, default: 0 },
    overall:       { type: Number, default: 0 }
  },
  xpEarned:     { type: Number, default: 0 }
}, { timestamps: true });

interviewSessionSchema.index({ userId: 1, startedAt: -1 });

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
export default InterviewSession;

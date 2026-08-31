import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  sessionId:    { type: String, unique: true, required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobRole:      { type: String, required: true },
  company:      { type: String, required: true },
  mode:         { type: String, enum: ['hr', 'technical', 'stress', 'mentor', 'panel'], required: true },
  difficulty:   { type: Number, default: 1 },
  status:       { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  startedAt:    { type: Date, default: Date.now },
  endedAt:      { type: Date },
  finalScores:  {
    technical:     { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence:    { type: Number, default: 0 },
    eyeContact:    { type: Number, default: 0 },
    posture:       { type: Number, default: 0 },
    fluency:       { type: Number, default: 0 },
    overall:       { type: Number, default: 0 }
  },
  reportId:     { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport' },
  xpEarned:     { type: Number, default: 0 }
}, { timestamps: true });

interviewSessionSchema.index({ userId: 1, startedAt: -1 });

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
export default InterviewSession;

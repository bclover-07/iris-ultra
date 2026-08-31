import mongoose from 'mongoose';

const interviewReportSchema = new mongoose.Schema({
  sessionId:         { type: String, required: true, index: true },
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobRole:           { type: String, required: true },
  company:           { type: String, required: true },
  mode:              { type: String, required: true },
  scores:            {
    technical:     { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence:    { type: Number, default: 0 },
    eyeContact:    { type: Number, default: 0 },
    posture:       { type: Number, default: 0 },
    fluency:       { type: Number, default: 0 },
    overall:       { type: Number, default: 0 }
  },
  verdict:           { type: String },
  strengths:         [{ type: String }],
  improvements:      [{ type: String }],
  weeklyActionPlan:  [{
    week:      { type: Number },
    focus:     { type: String },
    tasks:     [{ type: String }],
    resources: [{ type: String }]
  }],
  readinessLevel:    { type: String, enum: ['not_ready', 'needs_work', 'almost_ready', 'ready'] },
  companyFitScore:   { type: Number },
  recommendedRoles:  [{ type: String }],
  conversationHistory: [{
    role:      { type: String },
    text:      { type: String },
    timestamp: { type: Date },
    topic:     { type: String }
  }],
  keyLearningResources: [{
    title: { type: String },
    url:   { type: String },
    type:  { type: String }
  }],
  xpEarned:         { type: Number, default: 0 },
  createdAt:        { type: Date, default: Date.now }
}, { timestamps: true });

interviewReportSchema.index({ userId: 1, createdAt: -1 });

const InterviewReport = mongoose.model('InterviewReport', interviewReportSchema);
export default InterviewReport;

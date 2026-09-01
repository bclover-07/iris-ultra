import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // 1. Verified Study Presence (from Focus Guardian pose/face camera loop)
  presenceConsistency: {
    score: { type: Number, default: 85 }, // 0 - 100
    totalVerifiedMinutes: { type: Number, default: 0 },
    verifiedSessionsCount: { type: Number, default: 0 },
    streakDays: { type: Number, default: 1 },
    lastVerifiedAt: { type: Date, default: Date.now }
  },
  // 2. Quiz Mastery Score (from Camo Quizo gestures + Doubt Solver topic depth)
  quizMastery: {
    score: { type: Number, default: 80 }, // 0 - 100
    totalAnswered: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    topicBreakdown: {
      type: Map,
      of: Number,
      default: {}
    },
    weakTopics: [{ type: String }],
    strongTopics: [{ type: String }]
  },
  // 3. Study Plan Progress (Checklist on student's self-generated plan)
  studyPlanProgress: {
    score: { type: Number, default: 75 }, // 0 - 100
    completedTasks: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    activePlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan' }
  },
  // 4. Wellness Score (Breathing compliance + Ambient sensor + Voice sentiment)
  wellness: {
    score: { type: Number, default: 90 }, // 0 - 100
    breathingComplianceAvg: { type: Number, default: 92 },
    ambientScoreAvg: { type: Number, default: 88 },
    recentSentiment: { type: String, default: 'positive' }
  },
  // 5. Engagement (Mentor voice-turns + Doubt solver + Practice Area sessions)
  engagement: {
    score: { type: Number, default: 85 }, // 0 - 100
    mentorVoiceTurns: { type: Number, default: 0 },
    doubtSessionsCount: { type: Number, default: 0 },
    practiceSessionsCount: { type: Number, default: 0 }
  },
  // On-Device XGBoost / Weighted-Risk Output
  riskModel: {
    riskTier: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    riskScore: { type: Number, default: 12 }, // 0 - 100 risk
    topContributingFactors: [{ type: String }],
    modelVersion: { type: String, default: 'Hexagon-NPU-v3-ONNX' },
    lastInferenceAt: { type: Date, default: Date.now }
  },
  xp: { type: Number, default: 250 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 3 }
}, {
  timestamps: true
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile;

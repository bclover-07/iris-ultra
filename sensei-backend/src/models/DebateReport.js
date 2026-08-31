import mongoose from 'mongoose';

const debateReportSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  aiPersonality: { type: String, required: true },
  scores: {
    logic: Number,
    confidence: Number,
    clarity: Number,
    emotionalControl: Number,
    persuasion: Number,
    diplomacy: Number,
    overall: Number
  },
  psychologicalBreakdown: {
    overallVerdict: String,
    psychologicalProfile: {
      debatingStyle: String,
      underPressure: String,
      strengthsUnderPressure: [String],
      vulnerabilitiesUnderPressure: [String]
    },
    frustrationAnalysis: {
      triggerPoints: [String],
      pattern: String,
      recoveryAbility: String
    },
    confidenceAnalysis: {
      dropMoments: [String],
      peakMoments: [String],
      overallArc: String
    },
    logicWeaknesses: {
      recurringFallacies: [String],
      logicBreakdownMoments: [String],
      improvementFocus: String
    },
    emotionalManipulationDetected: {
      wasManipulated: Boolean,
      manipulationTechniquesUsed: [String],
      studentResponse: String,
      resistanceScore: Number
    },
    throwingBehavior: {
      interpretation: String,
      signal: String
    },
    strengths: [String],
    improvements: [String],
    weeklyTrainingPlan: [{
      week: Number,
      focus: String,
      drills: [String],
      mentalExercises: [String]
    }],
    debateRank: String,
    xpEarned: Number
  },
  emotionTimeline: [{
    time: Number,
    frustration: Number,
    confidence: Number,
    aggression: Number,
    expression: String
  }],
  fallaciesDetected: [{
    type: { type: String },
    excerpt: String,
    explanation: String,
    severity: String
  }],
  throwableEvents: [{
    item: String,
    hit: Boolean,
    timestamp: Number,
    emotionalContext: String
  }],
  conversationHistory: [{
    round: Number,
    phase: String,
    timestamp: Number,
    student: {
      text: String,
      logicScore: Number,
      emotionalState: String,
      fallacy: String
    },
    ai: {
      text: String,
      emotion: String,
      interrupted: Boolean
    }
  }],
  xpEarned: Number,
  createdAt: { type: Date, default: Date.now }
});

const DebateReport = mongoose.model('DebateReport', debateReportSchema);
export default DebateReport;

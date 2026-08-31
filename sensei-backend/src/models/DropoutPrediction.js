import mongoose from 'mongoose';

const dropoutPredictionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  confidence: { type: Number, default: 0, min: 0, max: 100 },
  riskTier: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  signals: {
    sentimentScore: { type: Number, default: 0 },
    sentimentSources: [String],
    attendanceVelocity: { type: Number, default: 0 },
    submissionDelays: { type: Number, default: 0 },
    behavioralFlags: [String]
  },
  riskDrivers: [{
    driver: String,
    weight: Number,
    description: String
  }],
  intervention: {
    message: { type: String, default: '' },
    type: { type: String, enum: ['email', 'meeting', 'counseling', 'academic_support', 'peer_mentoring'], default: 'email' },
    effectiveness: { type: Number, default: 0 },
    sent: { type: Boolean, default: false },
    sentAt: Date,
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  escalated: { type: Boolean, default: false },
  escalatedAt: Date,
  batchId: String
}, { timestamps: true });

dropoutPredictionSchema.index({ studentId: 1, createdAt: -1 });
dropoutPredictionSchema.index({ riskScore: -1 });

export default mongoose.model('DropoutPrediction', dropoutPredictionSchema);

import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  totalMinutes: { type: Number, default: 0 },
  focusedMinutes: { type: Number, default: 0 },
  focusScore: { type: Number, default: 0, min: 0, max: 100 },
  distractions: [{
    timestamp: Date,
    type: { type: String, enum: ['look_away', 'phone', 'noise', 'movement', 'other'] },
    duration: Number
  }],
  environment: {
    noiseLevel: { type: String, enum: ['quiet', 'moderate', 'noisy'], default: 'quiet' },
    recommendation: { type: String, default: '' }
  },
  fingerprint: {
    bestHours: [Number],
    avgDepth: { type: Number, default: 0 },
    triggers: [String],
    sessionQuality: { type: String, enum: ['deep', 'moderate', 'shallow'], default: 'moderate' }
  },
  streakDay: { type: Number, default: 0 }
}, { timestamps: true });

focusSessionSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model('FocusSession', focusSessionSchema);

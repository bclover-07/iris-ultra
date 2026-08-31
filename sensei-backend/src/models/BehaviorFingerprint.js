import mongoose from 'mongoose';

const behaviorFingerprintSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  students: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    signals: {
      attendancePattern: { type: Number, default: 0, min: 0, max: 100 },
      quizVelocity: { type: Number, default: 0, min: 0, max: 100 },
      wellnessScore: { type: Number, default: 50, min: 0, max: 100 },
      helpFrequency: { type: Number, default: 0, min: 0, max: 100 },
      studyDuration: { type: Number, default: 0, min: 0, max: 100 }
    },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' }
  }],
  correlations: [{
    pattern: String,
    affectedCount: Number,
    impactDescription: String,
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' }
  }],
  alerts: [{
    message: String,
    matchedStudents: [String],
    severity: { type: String, enum: ['info', 'warning', 'critical'] },
    actionSuggestion: String
  }],
  clusters: [{
    clusterId: String,
    size: Number,
    members: [String],
    representativeProfile: String
  }],
  analysisDate: { type: Date, default: Date.now }
}, { timestamps: true });

behaviorFingerprintSchema.index({ teacherId: 1, classId: 1 });

export default mongoose.model('BehaviorFingerprint', behaviorFingerprintSchema);

import mongoose from 'mongoose';

const resourcePlanSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  demandForecast: {
    predictions: [{
      resource: String,
      day: String,
      hour: Number,
      utilization: Number,
      confidence: Number
    }],
    peakTimes: [String],
    underutilized: [String]
  },
  workloadAnalysis: {
    alerts: [{
      teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      teacherName: String,
      issue: String,
      severity: { type: String, enum: ['info', 'warning', 'critical'] },
      suggestion: String
    }],
    overloadCount: Number
  },
  budgetForecast: {
    currentSpend: Number,
    projectedSpend: Number,
    shortfallRisk: Boolean,
    shortfallAmount: Number,
    recommendations: [{
      action: String,
      estimatedSavings: Number,
      priority: { type: String, enum: ['low', 'medium', 'high'] },
      timeline: String
    }],
    totalPotentialSavings: Number
  },
  heatmapData: [{
    resource: String,
    day: String,
    hour: Number,
    value: Number
  }],
  summary: { type: String, default: '' }
}, { timestamps: true });

resourcePlanSchema.index({ adminId: 1, createdAt: -1 });

export default mongoose.model('ResourcePlan', resourcePlanSchema);

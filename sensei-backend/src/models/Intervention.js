import mongoose from 'mongoose';

const interventionSchema = new mongoose.Schema({
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  triggerType:  { type: String, enum: ['manual', 'auto_critical', 'risk_threshold'], default: 'manual' },
  message:      { type: String, required: true },
  tags:         [{ type: String }],
  urgency:      { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status:       { type: String, enum: ['sent', 'viewed', 'acknowledged', 'resolved', 'in_progress'], default: 'sent' },
  outcome:      { type: String, enum: ['improved', 'pending', 'worsened', 'na'], default: 'pending' },
  riskAtSend:   { type: Number },
  studyPlanId:  { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlan' },
  viewedAt:     { type: Date },
  resolvedAt:   { type: Date },
}, { timestamps: true });

interventionSchema.index({ studentId: 1 });
interventionSchema.index({ teacherId: 1 });
interventionSchema.index({ urgency: 1, status: 1 });

const Intervention = mongoose.model('Intervention', interventionSchema);
export default Intervention;

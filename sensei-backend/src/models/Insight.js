import mongoose from 'mongoose';

const insightSchema = new mongoose.Schema({
  studentId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  cgpa:            { type: Number, default: 0 },
  riskLevel:       { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  dropoutScore:    { type: Number, default: 0 },
  riskReason:      { type: String },
  recommendations: [{ type: String }],
  badges:          [{ type: String }],
  classRank:       { type: Number },
  predictedScore:  { type: Number },
  avgAttendance:   { type: Number },
  totalSubjects:   { type: Number },
  generatedAt:     { type: Date, default: Date.now },
}, { timestamps: true });

insightSchema.index({ studentId: 1 }, { unique: true });
insightSchema.index({ riskLevel: 1 });
insightSchema.index({ classId: 1 });

const Insight = mongoose.model('Insight', insightSchema);
export default Insight;

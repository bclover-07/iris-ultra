import mongoose from 'mongoose';

const overcomeTaskSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['internal', 'external'], default: 'external' },
  status: { type: String, enum: ['pending', 'submitted', 'completed'], default: 'pending' },
  proofUrl: { type: String },
  submittedAt: { type: Date }
});

const overcomeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pastSummary: { type: String },
  futureProjection: { type: String },
  chartData: { type: mongoose.Schema.Types.Mixed },
  flowData: { type: mongoose.Schema.Types.Mixed },
  tasks: [overcomeTaskSchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

overcomeSchema.index({ studentId: 1 });

const Overcome = mongoose.model('Overcome', overcomeSchema);
export default Overcome;

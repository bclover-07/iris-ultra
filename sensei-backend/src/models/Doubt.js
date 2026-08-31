import mongoose from 'mongoose';

const doubtSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputType: { type: String, enum: ['voice', 'image', 'text'], required: true },
  transcription: { type: String, default: '' },
  ocrText: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  originalQuery: { type: String, required: true },
  courseContext: { type: String, default: '' },
  solution: {
    steps: [{ stepNumber: Number, title: String, content: String, latex: String, visual: String }],
    explanation: { type: String, default: '' },
    narration: { type: String, default: '' },
    summary: { type: String, default: '' }
  },
  subject: { type: String, default: '' },
  difficulty: { type: String, enum: ['basic', 'intermediate', 'advanced'], default: 'intermediate' },
  resolved: { type: Boolean, default: true }
}, { timestamps: true });

doubtSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model('Doubt', doubtSchema);

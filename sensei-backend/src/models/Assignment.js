import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  title: { type: String, required: true },
  brief: { type: String, required: true },
  subject: { type: String, default: '' },
  dueDate: Date,
  rubric: {
    criteria: [{
      name: String,
      maxPoints: Number,
      description: String,
      levels: [{
        label: String,
        points: Number,
        descriptor: String
      }]
    }],
    totalPoints: { type: Number, default: 100 }
  },
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    submittedAt: { type: Date, default: Date.now },
    aiScore: { type: Number, default: 0, min: 0, max: 100 },
    plagiarismScore: { type: Number, default: 0, min: 0, max: 100 },
    semanticMatches: [{
      matchedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      similarity: Number,
      excerpt: String
    }],
    grade: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    flags: [{
      type: { type: String, enum: ['ai_generated', 'plagiarism', 'late'] },
      confidence: Number,
      evidence: String
    }],
    status: { type: String, enum: ['pending', 'graded', 'reviewed', 'flagged'], default: 'pending' },
    historyContext: {
      trend: { type: String, default: 'stable' },
      growthScore: { type: Number, default: 0 },
      aiMemory: { type: String, default: '' }
    }
  }],
  status: { type: String, enum: ['draft', 'active', 'graded', 'closed'], default: 'draft' }
}, { timestamps: true });

assignmentSchema.index({ teacherId: 1, createdAt: -1 });

export default mongoose.model('Assignment', assignmentSchema);

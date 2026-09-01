import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  generatedBy:    { type: String, enum: ['student_request', 'camo_arena', 'auto'], default: 'student_request' },
  mode:           { type: String, enum: ['topic', 'camo', 'practice', 'standard'], default: 'camo' },
  topic:          { type: String, default: 'General STEM' },
  difficulty:     { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  questions: [{
    id:            { type: String },
    question:      { type: String, required: true },
    options:       [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation:   { type: String },
    difficulty:    { type: String },
    topic:         { type: String }
  }],
  totalQuestions: { type: Number, default: 4 },
}, { timestamps: true });

quizSchema.index({ studentId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;

import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  generatedBy:    { type: String, enum: ['student_request', 'teacher_assign', 'auto'], default: 'student_request' },
  mode:           { type: String, enum: ['topic', 'intervention', 'camo', 'standard'], default: 'topic' },
  topic:          { type: String },
  interventionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intervention' },
  difficulty:     { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  questions: [{
    id:            { type: String },
    question:      { type: String },
    options:       [{ type: String }],
    correctAnswer: { type: String },
    explanation:   { type: String },
    difficulty:    { type: String },
    topic:         { type: String }
  }],
  totalQuestions: { type: Number, default: 10 },
}, { timestamps: true });

quizSchema.index({ studentId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;

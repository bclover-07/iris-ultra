import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  quizMode:     { type: String, enum: ['standard', 'camo'], default: 'standard' },
  answers:      [{
    questionId:     { type: String },
    selectedOption: { type: String },
    correct:        { type: Boolean }
  }],
  score:        { type: Number, default: 0 },
  percentage:   { type: Number, default: 0 },
  timeTaken:    { type: Number, default: 0 },
  weakAreas:    [{ type: String }],
  xpEarned:     { type: Number, default: 0 },
  badgesEarned: [{ type: String }],
}, { timestamps: true });

quizAttemptSchema.index({ studentId: 1 });
quizAttemptSchema.index({ quizId: 1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;

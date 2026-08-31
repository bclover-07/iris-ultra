import mongoose from 'mongoose';

const worldSessionSchema = new mongoose.Schema({
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId:             { type: String, required: true },
  joinedAt:           { type: Date, default: Date.now },
  leftAt:             { type: Date },
  xpEarned:           { type: Number, default: 0 },
  finalRank:          { type: Number },
  questionsAnswered:  { type: Number, default: 0 },
  correctAnswers:     { type: Number, default: 0 },
  bestStreak:         { type: Number, default: 0 },
  subjectTags:        [{ type: String }],
}, { timestamps: true });

worldSessionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('WorldSession', worldSessionSchema);

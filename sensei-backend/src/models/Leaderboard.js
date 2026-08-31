import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  classId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  semester:   { type: Number },
  entries:    [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:      { type: String },
    score:     { type: Number, default: 0 },
    xp:        { type: Number, default: 0 },
    rank:      { type: Number },
    badges:    [{ type: String }],
    change:    { type: Number, default: 0 }
  }],
  updatedAt:  { type: Date, default: Date.now }
}, { timestamps: true });

leaderboardSchema.index({ classId: 1 }, { unique: true });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
export default Leaderboard;

import mongoose from 'mongoose';

const worldRoomSchema = new mongoose.Schema({
  roomId:         { type: String, unique: true, required: true },
  name:           { type: String, required: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectTags:    [{ type: String }],
  roomType:       { type: String, enum: ['study', 'quiz_battle', 'exam_prep', 'social'], default: 'study' },
  visibility:     { type: String, enum: ['public', 'class', 'private'], default: 'public' },
  inviteCode:     { type: String },
  maxPlayers:     { type: Number, default: 25 },
  currentPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive:       { type: Boolean, default: true },
  closedAt:       { type: Date },
}, { timestamps: true });

worldRoomSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model('WorldRoom', worldRoomSchema);

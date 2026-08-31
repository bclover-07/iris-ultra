import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  classId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  question:    { type: String, required: true },
  options:     [{ type: String }],
  responses:   [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    option:    { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  isOpen:      { type: Boolean, default: true },
  duration:    { type: Number },
  expiresAt:   { type: Date },
  code:        { type: String, unique: true, sparse: true },
  closedAt:    { type: Date },
}, { timestamps: true });

pollSchema.index({ classId: 1, isOpen: 1 });

const Poll = mongoose.model('Poll', pollSchema);
export default Poll;

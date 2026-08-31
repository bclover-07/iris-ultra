import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  classId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  semester:        { type: Number, default: 1 },
  guardian: {
    name:          { type: String },
    email:         { type: String },
    phone:         { type: String }
  },
  xp:              { type: Number, default: 0 },
  level:           { type: Number, default: 1 },
  badges:          [{ type: String }],
  streakDays:      { type: Number, default: 0 },
  lastActiveDate:  { type: Date },
  totalStudyTime:  { type: Number, default: 0 },
}, { timestamps: true });

studentSchema.index({ classId: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;

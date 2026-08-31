import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject:     { type: String, required: true },
  attended:    { type: Number, default: 0 },
  total:       { type: Number, default: 0 },
  percentage:  { type: Number, default: 0 },
  semester:    { type: Number },
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, classId: 1, subject: 1 });

attendanceSchema.pre('save', function (next) {
  if (this.total > 0) {
    this.percentage = Math.round((this.attended / this.total) * 100 * 100) / 100;
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;

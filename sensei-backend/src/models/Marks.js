import mongoose from 'mongoose';

const marksSchema = new mongoose.Schema({
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject:     { type: String, required: true },
  ut1:         { type: Number, default: 0 },
  midSem:      { type: Number, default: 0 },
  ut2:         { type: Number, default: 0 },
  endSem:      { type: Number, default: 0 },
  total:       { type: Number, default: 0 },
  percentage:  { type: Number, default: 0 },
  grade:       { type: String },
  semester:    { type: Number },
}, { timestamps: true });

marksSchema.index({ studentId: 1, classId: 1, subject: 1 });

marksSchema.pre('save', function (next) {
  this.total = (this.ut1 || 0) + (this.midSem || 0) + (this.ut2 || 0) + (this.endSem || 0);
  this.percentage = Math.round((this.total / 150) * 100 * 100) / 100;
  next();
});

const Marks = mongoose.model('Marks', marksSchema);
export default Marks;

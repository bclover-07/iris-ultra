import mongoose from 'mongoose';

const performanceRecordSchema = new mongoose.Schema({
  studentId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester:          { type: Number, required: true },
  cgpa:              { type: Number, default: 0 },
  rank:              { type: Number },
  attendance:        { type: Number, default: 0 },
  subjectBreakdown:  [{
    subject:    { type: String },
    marks:      { type: Number },
    grade:      { type: String },
    attendance: { type: Number }
  }],
}, { timestamps: true });

performanceRecordSchema.index({ studentId: 1, semester: 1 });

const PerformanceRecord = mongoose.model('PerformanceRecord', performanceRecordSchema);
export default PerformanceRecord;

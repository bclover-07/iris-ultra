import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  semester:    { type: Number, required: true },
  department:  { type: String, required: true },
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subjects:    [{ type: String }],
  academicYear: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

classSchema.index({ department: 1, semester: 1 });

const Class = mongoose.model('Class', classSchema);
export default Class;

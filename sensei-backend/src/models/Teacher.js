import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  subjects:      [{ type: String }],
  departments:   [{ type: String }],
  classIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  qualification: { type: String },
  experience:    { type: Number, default: 0 },
}, { timestamps: true });

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;

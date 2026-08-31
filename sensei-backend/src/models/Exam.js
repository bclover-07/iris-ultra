import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  date: {
    type: String, // 'YYYY-MM-DD' format or similar, as sent by frontend
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    default: '2 hrs',
  },
  maxMarks: {
    type: Number,
    default: 100,
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'ongoing', 'completed'],
    default: 'draft',
  },
  submissions: {
    type: Number,
    default: 0,
  },
  avgScore: {
    type: Number,
    default: 0,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  }
}, { timestamps: true });

export default mongoose.model('Exam', examSchema);

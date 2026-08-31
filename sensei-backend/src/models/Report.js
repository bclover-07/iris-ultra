import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'generated', 'failed'],
    default: 'generated'
  },
  fileUrl: {
    type: String
  }
}, { timestamps: true });

export default mongoose.models.Report || mongoose.model('Report', reportSchema);

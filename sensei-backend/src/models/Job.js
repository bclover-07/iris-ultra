import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  company:      { type: String, required: true },
  type:         { type: String, required: true, default: 'Full-time' },
  location:     { type: String, required: true },
  salary:       { type: String, required: true },
  deadline:     { type: String, required: true },
  description:  { type: String, required: true },
  status:       { type: String, enum: ['open', 'in_review', 'closed'], default: 'open' },
  applicants:   [{
    studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:     { type: String, enum: ['applied', 'approved', 'rejected'], default: 'applied' },
    matchScore: { type: Number, default: 85 },
    appliedAt:  { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
export default Job;

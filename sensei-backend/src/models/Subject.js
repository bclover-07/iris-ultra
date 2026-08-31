import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  code:       { type: String, required: true, unique: true },
  department: { type: String, required: true },
  credits:    { type: Number, default: 3 },
  maxMarks: {
    ut1:      { type: Number, default: 20 },
    midSem:   { type: Number, default: 30 },
    ut2:      { type: Number, default: 20 },
    endSem:   { type: Number, default: 80 },
    total:    { type: Number, default: 150 }
  },
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;

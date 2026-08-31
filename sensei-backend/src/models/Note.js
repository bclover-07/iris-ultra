import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, required: true },
  content:    { type: String, required: true },
  tags:       [{ type: String }],
  chartData:  { type: mongoose.Schema.Types.Mixed },
  hasChart:   { type: Boolean, default: false },
  flowData:   { type: mongoose.Schema.Types.Mixed },
  isAiNote:   { type: Boolean, default: false },
  aiSource:   { type: String, enum: ['text', 'pdf', 'video', 'none'], default: 'none' },
  folder:     { type: String, default: 'General' },
  attachments:[{
    name: { type: String },
    url:  { type: String },
    type: { type: String }
  }]
}, { timestamps: true });

noteSchema.index({ studentId: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ folder: 1 });

const Note = mongoose.model('Note', noteSchema);
export default Note;

import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema({
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planType:       { type: String, enum: ['normal', 'advanced'], default: 'normal' },
  mode:           { type: String, enum: ['topic', 'curriculum', 'exam_prep'], default: 'topic' },
  topic:          { type: String, required: true },
  title:          { type: String, required: true },
  totalDays:      { type: Number, default: 7 },
  hoursPerDay:    { type: Number, default: 2 },
  dailySessions:  [{
    day:            { type: Number, required: true },
    date:           { type: String },
    topics:         [{ type: String }],
    activities:     [{ type: String }],
    resources:      [{ type: String }],
    videoTimestamp: { type: String },
    completed:      { type: Boolean, default: false }
  }],
  videoUrl:       { type: String },
  videoSummary: {
    title:     { type: String },
    summary:   { type: String },
    keyPoints: [{ type: String }]
  },
  summaryCards: [{
    title:    { type: String },
    keyPoint: { type: String },
    emoji:    { type: String },
    color:    { type: String },
    category: { type: String }
  }],
  chapters: [{
    title:     { type: String },
    startTime: { type: String },
    content:   { type: String }
  }],
  progress:      { type: Number, default: 0 },
}, { timestamps: true });

studyPlanSchema.index({ studentId: 1, createdAt: -1 });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
export default StudyPlan;

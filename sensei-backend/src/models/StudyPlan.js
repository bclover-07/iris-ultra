import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema({
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planType:       { type: String, enum: ['normal', 'advanced'], default: 'normal' },
  mode:           { type: String, enum: ['topic', 'intervention'], default: 'topic' },
  topic:          { type: String },
  interventionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Intervention' },
  title:          { type: String },
  totalDays:      { type: Number, default: 7 },
  hoursPerDay:    { type: Number, default: 2 },
  dailySessions:  [{
    day:            { type: Number },
    date:           { type: String },
    topics:         [{ type: String }],
    activities:     [{ type: String }],
    resources:      [{ type: String }],
    videoTimestamp:  { type: String },
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
  charts: [{
    type:   { type: String },
    title:  { type: String },
    data:   { type: mongoose.Schema.Types.Mixed },
    config: { type: mongoose.Schema.Types.Mixed }
  }],
  diagrams: [{
    type:   { type: String },
    title:  { type: String },
    nodes:  { type: mongoose.Schema.Types.Mixed },
    edges:  { type: mongoose.Schema.Types.Mixed }
  }],
  chapters: [{
    title:     { type: String },
    startTime: { type: String },
    content:   { type: String }
  }],
  emailSent:     { type: Boolean, default: false },
  emailSentAt:   { type: Date },
  emailSentTo:   { type: String },
  progress:      { type: Number, default: 0 },
}, { timestamps: true });

studyPlanSchema.index({ studentId: 1, createdAt: -1 });
studyPlanSchema.index({ studentId: 1, planType: 1 });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
export default StudyPlan;

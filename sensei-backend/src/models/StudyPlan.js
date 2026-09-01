import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema({
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  planType:       { type: String, enum: ['normal', 'advanced'], default: 'normal' },
  mode:           { type: String, enum: ['topic', 'curriculum', 'exam_prep', 'intervention'], default: 'topic' },
  topic:          { type: String },
  subject:        { type: String },
  title:          { type: String },
  totalDays:      { type: Number, default: 7 },
  targetDays:     { type: Number, default: 7 },
  hoursPerDay:    { type: Number, default: 2.5 },
  days: [{
    dayNumber: { type: Number },
    topic: { type: String },
    tasks: [{
      title: { type: String },
      durationMinutes: { type: Number, default: 45 },
      completed: { type: Boolean, default: false }
    }]
  }],
  dailySessions:  [{
    day:            { type: Number },
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
  totalTasks:     { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  progressPercent:{ type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
  progress:       { type: Number, default: 0 },
}, { timestamps: true, strict: false });

studyPlanSchema.index({ studentId: 1, createdAt: -1 });
studyPlanSchema.index({ userId: 1, createdAt: -1 });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
export default StudyPlan;

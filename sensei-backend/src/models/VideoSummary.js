import mongoose from 'mongoose';

const videoSummarySchema = new mongoose.Schema({
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl:       { type: String, required: true },
  videoId:        { type: String },
  title:          { type: String },
  transcript:     { type: String },
  summary:        { type: String },
  summaryCards:   [{
    title:     { type: String },
    content:   { type: String },
    emoji:     { type: String },
    color:     { type: String },
    timestamp: { type: String }
  }],
  keyPoints:      [{ type: String }],
  chapters:       [{
    title:      { type: String },
    startTime:  { type: String },
    content:    { type: String }
  }],
  quizQuestions:  [{
    question:     { type: String },
    options:      [{ type: String }],
    answer:       { type: String },
    explanation:  { type: String }
  }],
  studyNotes:     { type: String },
}, { timestamps: true });

videoSummarySchema.index({ studentId: 1 });

const VideoSummary = mongoose.model('VideoSummary', videoSummarySchema);
export default VideoSummary;

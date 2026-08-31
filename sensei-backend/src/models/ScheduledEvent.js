import mongoose from 'mongoose';

const scheduledEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Assessment', 'Meeting', 'Remedial', 'Workshop', 'Deadline', 'Class']
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  className: {
    type: String,
  },
  subject: {
    type: String,
  },
  location: {
    type: String,
  },
  attendees: {
    type: Number,
    default: 0
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const ScheduledEvent = mongoose.model('ScheduledEvent', scheduledEventSchema);
export default ScheduledEvent;

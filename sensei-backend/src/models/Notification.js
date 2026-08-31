import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, enum: ['info', 'warning', 'success', 'danger', 'badge', 'intervention', 'quiz', 'system'], default: 'info' },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  link:      { type: String },
  isRead:    { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

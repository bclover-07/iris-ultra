import mongoose from 'mongoose';

const voiceJournalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  audioUrl: { type: String },
  transcript: { type: String, required: true },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'stressed', 'anxious', 'motivated', 'tired'],
    default: 'positive'
  },
  sentimentScore: { type: Number, default: 0.8 }, // -1.0 to 1.0
  inferredOnDevice: { type: Boolean, default: true },
  tags: [{ type: String }],
  durationSeconds: { type: Number, default: 45 }
}, {
  timestamps: true
});

const VoiceJournal = mongoose.model('VoiceJournal', voiceJournalSchema);
export default VoiceJournal;

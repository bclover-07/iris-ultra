import mongoose from 'mongoose';

const helpTicketSchema = new mongoose.Schema({
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:        { type: String, required: true },
  category:       { type: String },
  tags:           [{ type: String }],
  urgency:        { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  sentiment:      { type: Number },
  assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:         { type: String, enum: ['pending', 'assigned', 'responded', 'resolved'], default: 'pending' },
  response:       { type: String },
  respondedAt:    { type: Date },
  resolvedAt:     { type: Date },
}, { timestamps: true });

helpTicketSchema.index({ studentId: 1 });
helpTicketSchema.index({ assignedTo: 1, status: 1 });

const HelpTicket = mongoose.model('HelpTicket', helpTicketSchema);
export default HelpTicket;

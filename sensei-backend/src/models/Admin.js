import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  permissionScope: { type: String, enum: ['full', 'department', 'readonly'], default: 'full' },
  managedDepts:    [{ type: String }],
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;

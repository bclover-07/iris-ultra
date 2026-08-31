import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:         { type: String, required: true, select: false },
  role:             { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  department:       { type: String, required: true, index: true },
  studentId:        { type: String, sparse: true, unique: true },
  isFirstLogin:     { type: Boolean, default: true },
  isActive:         { type: Boolean, default: true },
  avatar:           { type: String },
  phone:            { type: String },
  resetToken:       { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },
  refreshToken:     { type: String, select: false },
  lastLogin:        { type: Date },
  xp:               { type: Number, default: 0 },
  debateRank:       { type: String, default: 'Unranked' },
}, { timestamps: true });

userSchema.index({ role: 1, department: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetToken;
  delete obj.resetTokenExpiry;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;

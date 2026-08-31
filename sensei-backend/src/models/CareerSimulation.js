import mongoose from 'mongoose';

const careerSimulationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputs: {
    interests: [String],
    cgpa: { type: Number, default: 0 },
    skills: [String],
    targetCompanies: [String],
    currentSemester: { type: Number, default: 1 }
  },
  trajectories: [{
    type: { type: String, enum: ['conservative', 'ambitious', 'wildcard'] },
    title: String,
    probability: Number,
    milestones: [{
      month: Number,
      title: String,
      description: String,
      skills: [String]
    }],
    actions: [String],
    narrative: String,
    targetRole: String,
    expectedSalary: String
  }],
  marketInsights: {
    trendingSkills: [String],
    growthSectors: [String],
    demandScore: Number
  },
  resumeMatch: {
    score: Number,
    gaps: [String],
    strengths: [String]
  }
}, { timestamps: true });

careerSimulationSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model('CareerSimulation', careerSimulationSchema);

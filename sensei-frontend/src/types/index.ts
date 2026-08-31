export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  department: string;
  studentId?: string;
  avatar?: string;
  debateRank?: string;
  debateWins?: number;
  xp?: number;
  profile?: StudentProfile | TeacherProfile | AdminProfile;
}

export interface StudentProfile {
  classId?: string;
  semester: number;
  guardian?: { name?: string; email?: string; phone?: string };
  xp: number;
  level: number;
  badges: string[];
  streakDays: number;
  totalStudyTime: number;
}

export interface TeacherProfile {
  subjects: string[];
  departments: string[];
  classIds: string[];
}

export interface AdminProfile {
  permissionScope: string;
  managedDepts: string[];
}

export interface StudentDashboard {
  name: string;
  cgpa: number;
  avgAttendance: number;
  classRank: number;
  totalStudents: number;
  dropoutProbability: number;
  dropoutTier: string;
  riskLevel: string;
  riskReason: string;
  recommendations: string[];
  marksTrend: { labels: string[]; datasets: { label: string; data: number[] }[] };
  subjectMarks: SubjectMark[];
  recentNotifications: Notification[];
  leaderboardPosition: { rank: number; score: number; percentile: number };
  activeInterventions: number;
  streakDays: number;
  totalXP: number;
  badges: string[];
  level?: number;
  activePolls: number;
  pendingHelpTickets: number;
  attendanceHistory?: { month: string; percentage: number; days: boolean[] }[];
  semesterGPAs?: { sem: string; gpa: string; credits: number }[];
}

export interface SubjectMark {
  subject: string;
  ut1: number;
  midSem: number;
  ut2: number;
  endSem: number;
  total: number;
  percentage: number;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  topic: string;
}

export interface QuizResult {
  score: number;
  percentage: number;
  timeTaken: number;
  results: { questionId: string; correct: boolean; correctAnswer: string; explanation: string; yourAnswer: string }[];
  weakAreas: string[];
  recommendations: string[];
  xpEarned: number;
  badgesEarned: string[];
  nextDifficulty: string;
}

export interface StudyPlan {
  _id: string;
  title: string;
  planType: string;
  mode: string;
  totalDays: number;
  dailySessions: DaySession[];
  videoSummary?: { title: string; summary: string; keyPoints: string[] };
  summaryCards?: SummaryCard[];
  charts?: ChartConfig[];
  progress: number;
  createdAt: string;
}

export interface DaySession {
  day: number;
  topics: string[];
  activities: string[];
  resources: string[];
  completed?: boolean;
}

export interface SummaryCard {
  title: string;
  keyPoint: string;
  emoji: string;
  color: string;
}

export interface ChartConfig {
  type: string;
  title: string;
  data: Record<string, unknown>[];
  config?: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface NoteItem {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  hasChart: boolean;
  chartData?: Record<string, unknown>;
  createdAt: string;
}

export interface Intervention {
  _id: string;
  studentId: string | { name: string };
  teacherId: string | { name: string };
  message: string;
  tags: string[];
  urgency: string;
  status: string;
  outcome: string;
  createdAt: string;
}

export interface HelpTicket {
  _id: string;
  message: string;
  tags: string[];
  urgency: string;
  status: string;
  response?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  score: number;
  xp: number;
  badges: string[];
  change: number;
  isCurrentUser?: boolean;
}

export interface TeacherDashboard {
  name: string;
  department: string;
  subjects: string[];
  totalStudents: number;
  atRiskCount: number;
  criticalCount: number;
  effectivenessScore: number;
  classPassRate: number;
  pendingHelpTickets: number;
  recentInterventions: Intervention[];
  teachingRecommendations: string[];
}

export interface AdminDashboard {
  university: { totalStudents: number; totalTeachers: number; totalDepartments: number; totalClasses: number };
  performance: { avgCgpa: number; passRate: number; avgAttendance: number; atRiskPercentage: number };
  riskDistribution: { critical: number; high: number; medium: number; low: number };
  interventions: { total: number; successful: number; pending: number; worsened: number };
}


export interface Doubt {
  _id: string;
  studentId: string;
  inputType: 'voice' | 'image' | 'text';
  transcription: string;
  ocrText: string;
  imageUrl: string;
  originalQuery: string;
  subject: string;
  solution: {
    steps: { stepNumber: number; title: string; content: string; latex: string; visual: string }[];
    explanation: string;
    narration: string;
    summary: string;
  };
  createdAt: string;
}

export interface FocusSession {
  _id: string;
  studentId: string;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  focusedMinutes: number;
  focusScore: number;
  distractions: { timestamp: string; type: string; duration: number }[];
  environment: { noiseLevel: string; recommendation: string };
  fingerprint: { bestHours: number[]; avgDepth: number; triggers: string[]; sessionQuality: string };
  createdAt: string;
}

export interface CareerSimulation {
  _id: string;
  inputs: { interests: string[]; cgpa: number; skills: string[]; targetCompanies: string[] };
  trajectories: {
    type: 'conservative' | 'ambitious' | 'wildcard';
    title: string;
    probability: number;
    targetRole: string;
    expectedSalary: string;
    milestones: { month: number; title: string; description: string; skills: string[] }[];
    actions: string[];
    narrative: string;
  }[];
  marketInsights: { trendingSkills: string[]; growthSectors: string[]; demandScore: number };
  resumeMatch: { score: number; gaps: string[]; strengths: string[] };
  createdAt: string;
}

export interface Assignment {
  _id: string;
  teacherId: string;
  classId: string;
  title: string;
  brief: string;
  subject: string;
  dueDate: string;
  rubric?: {
    criteria: { name: string; maxPoints: number; description: string }[];
    totalPoints: number;
  };
  submissions: Submission[];
  status: string;
  createdAt: string;
}

export interface Submission {
  studentId: string | { name: string };
  content: string;
  aiScore: number;
  plagiarismScore: number;
  grade: number;
  feedback: string;
  status: string;
  flags: { type: string; confidence: number; evidence: string }[];
}

export interface BehaviorFingerprint {
  _id: string;
  classId: string;
  correlations: { pattern: string; affectedCount: number; impactDescription: string; severity: string }[];
  alerts: { message: string; matchedStudents: string[]; severity: string; actionSuggestion: string }[];
  analysisDate: string;
}

export interface DropoutPrediction {
  _id: string;
  studentId: { name: string; studentId: string; department: string };
  riskScore: number;
  confidence: number;
  riskTier: string;
  riskDrivers: { driver: string; weight: number; description: string }[];
  intervention: { message: string; sent: boolean; sentAt?: string };
}

export interface ResourcePlan {
  _id: string;
  demandForecast: { predictions: any[]; peakTimes: string[]; underutilized: string[] };
  workloadAnalysis: { alerts: any[]; overloadCount: number };
  budgetForecast: { currentSpend: number; totalPotentialSavings: number; recommendations: any[] };
  heatmapData: { resource: string; day: string; hour: number; value: number }[];
  summary: string;
}

export interface Poll {
  _id: string;
  teacherId: string | { name: string };
  classId: string;
  question: string;
  options: string[];
  responses: { studentId: string; option: string; timestamp: string }[];
  isOpen: boolean;
  code?: string;
  closedAt?: string;
  createdAt: string;
  expiresAt?: string;
  results?: { option: string; count: number; percentage: number }[];
}

import Marks from '../models/Marks.js';
import Attendance from '../models/Attendance.js';
import { calculateRiskScore } from '../utils/riskScorer.js';

export const getStudentPerformance = async (studentId) => {
  const [marks, attendance] = await Promise.all([
    Marks.find({ studentId }).lean(),
    Attendance.find({ studentId }).lean()
  ]);

  const subjects = [...new Set(marks.map((m) => m.subject))];
  
  const totalPercentage = marks.length > 0
    ? marks.reduce((sum, m) => sum + (m.percentage || 0), 0) / marks.length
    : 0;

  const cgpa = (totalPercentage / 100) * 10;

  const avgAttendance = attendance.length > 0
    ? attendance.reduce((sum, a) => sum + (a.percentage || 0), 0) / attendance.length
    : 0;

  const risk = calculateRiskScore({ marks, attendance, cgpa });

  return {
    marks,
    attendance,
    subjects,
    totalPercentage,
    cgpa: Math.round(cgpa * 100) / 100,
    avgAttendance: Math.round(avgAttendance * 100) / 100,
    risk
  };
};

export default { getStudentPerformance };

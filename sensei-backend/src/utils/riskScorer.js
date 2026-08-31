export const calculateRiskScore = (studentData) => {
  const { marks = [], attendance = [], cgpa = 0 } = studentData;

  let score = 0;

  if (cgpa < 4.0) score += 30;
  else if (cgpa < 6.0) score += 20;
  else if (cgpa < 7.0) score += 10;
  else score += 0;

  const avgAttendance = attendance.length > 0
    ? attendance.reduce((sum, a) => sum + (a.percentage || 0), 0) / attendance.length
    : 100;

  if (avgAttendance < 50) score += 30;
  else if (avgAttendance < 65) score += 20;
  else if (avgAttendance < 75) score += 10;
  else score += 0;

  const failingSubjects = marks.filter((m) => (m.percentage || 0) < 40).length;
  if (failingSubjects >= 3) score += 25;
  else if (failingSubjects >= 2) score += 15;
  else if (failingSubjects >= 1) score += 8;

  const avgMarks = marks.length > 0
    ? marks.reduce((sum, m) => sum + (m.percentage || 0), 0) / marks.length
    : 50;

  if (avgMarks < 35) score += 15;
  else if (avgMarks < 50) score += 8;

  score = Math.min(score, 100);

  let tier;
  if (score >= 70) tier = 'critical';
  else if (score >= 50) tier = 'high';
  else if (score >= 25) tier = 'medium';
  else tier = 'low';

  let reason = '';
  const reasons = [];
  if (cgpa < 5.0) reasons.push('Low CGPA');
  if (avgAttendance < 65) reasons.push('Poor attendance');
  if (failingSubjects > 0) reasons.push(`Failing ${failingSubjects} subject(s)`);
  if (avgMarks < 40) reasons.push('Low average marks');
  reason = reasons.length > 0 ? reasons.join(', ') : 'Performing well';

  return { score, tier, reason, avgAttendance, avgMarks, failingSubjects };
};

export default { calculateRiskScore };

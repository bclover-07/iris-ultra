import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Student from './src/models/Student.js';
import Class from './src/models/Class.js';
import Subject from './src/models/Subject.js';
import Marks from './src/models/Marks.js';
import Attendance from './src/models/Attendance.js';
import Insight from './src/models/Insight.js';
import Leaderboard from './src/models/Leaderboard.js';
import Intervention from './src/models/Intervention.js';
import StudyPlan from './src/models/StudyPlan.js';
import Poll from './src/models/Poll.js';
import HelpTicket from './src/models/HelpTicket.js';

const DEPARTMENTS = ['CSE', 'IT', 'BTECH', 'AI'];

const SUBJECTS_MAP = {
  CSE: ['Data Structures', 'Operating Systems', 'Database Management', 'Computer Networks', 'Software Engineering'],
  IT: ['Web Technologies', 'Cloud Computing', 'Information Security', 'Mobile App Development', 'Data Analytics'],
  BTECH: ['Engineering Mathematics', 'Applied Physics', 'Mechanics', 'Thermodynamics', 'Material Science'],
  AI: ['Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Reinforcement Learning']
};

const FIRST_NAMES = ['Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Arjun', 'Kavya', 'Aditya', 'Ishita'];
const LAST_NAMES = ['Sharma', 'Patel', 'Kumar', 'Reddy', 'Singh', 'Gupta', 'Verma', 'Nair', 'Joshi', 'Rao'];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}), Student.deleteMany({}),
      Class.deleteMany({}), Subject.deleteMany({}),
      Marks.deleteMany({}), Attendance.deleteMany({}), Insight.deleteMany({}),
      Leaderboard.deleteMany({}), Intervention.deleteMany({}),
      StudyPlan.deleteMany({}), Poll.deleteMany({}), HelpTicket.deleteMany({})
    ]);
    console.log('Cleared all collections for Iris Plus Student OS');

    for (const dept of DEPARTMENTS) {
      const subjects = [];
      for (const subName of SUBJECTS_MAP[dept]) {
        const sub = await Subject.create({
          name: subName, code: `${dept}${SUBJECTS_MAP[dept].indexOf(subName) + 101}`,
          department: dept, semester: 5,
          credits: rand(3, 4), maxMarks: { ut1: 20, midSem: 30, ut2: 20, endSem: 80 }
        });
        subjects.push(sub);
      }

      const cls = await Class.create({
        name: `${dept}-S5-2025`, department: dept, semester: 5,
        subjectIds: subjects.map(s => s._id),
        studentIds: []
      });

      const studentIds = [];
      for (let i = 0; i < 10; i++) {
        const firstName = FIRST_NAMES[i];
        const lastName = LAST_NAMES[i];
        const rollNum = `${dept}${2025}${String(i + 1).padStart(3, '0')}`;

        const studentUser = await User.create({
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${dept.toLowerCase()}@sensei.edu`,
          password: 'student123', role: 'student',
          department: dept, studentId: rollNum
        });

        const student = await Student.create({
          userId: studentUser._id, classId: cls._id,
          semester: 5, xp: rand(500, 3500),
          level: rand(1, 10), badges: ['🧠 Deep Thinker', '🎯 Laser Focus', '🔥 10-Day Streak'],
          streakDays: rand(3, 25), totalStudyTime: rand(50, 600)
        });

        studentIds.push(studentUser._id);

        let totalMarksSum = 0;
        let totalMaxSum = 0;
        const subjectScores = [];
        for (const sub of subjects) {
          const forceLow = i < 2;
          const ut1 = forceLow ? rand(4, 8) : rand(12, 20);
          const midSem = forceLow ? rand(8, 14) : rand(18, 30);
          const ut2 = forceLow ? rand(5, 10) : rand(12, 20);
          const endSem = forceLow ? rand(20, 40) : rand(45, 80);
          const total = ut1 + midSem + ut2 + endSem;
          const max = 20 + 30 + 20 + 80;
          const pct = Math.round((total / max) * 100);

          await Marks.create({
            studentId: studentUser._id, subject: sub.name,
            classId: cls._id, semester: 5,
            ut1, midSem, ut2, endSem, total, percentage: pct
          });

          totalMarksSum += total;
          totalMaxSum += max;
          subjectScores.push({ subject: sub.name, percentage: pct });

          const totalClasses = rand(40, 55);
          const attended = forceLow ? rand(20, 28) : rand(32, totalClasses);
          await Attendance.create({
            studentId: studentUser._id, subject: sub.name,
            classId: cls._id, semester: 5,
            total: totalClasses, attended,
            percentage: Math.round((attended / totalClasses) * 100)
          });
        }

        const avgPct = Math.round(totalMarksSum / totalMaxSum * 100);
        const cgpa = Math.round((avgPct / 10) * 100) / 100;
        const riskLevel = cgpa < 4.5 ? 'critical' : cgpa < 6.0 ? 'high' : cgpa < 7.5 ? 'medium' : 'low';
        const dropoutScore = Math.max(0, Math.min(100, Math.round(100 - cgpa * 10)));

        const weakSubjects = subjectScores.filter(s => s.percentage < 50).map(s => s.subject);
        const riskReason = weakSubjects.length > 0
          ? `Improvement recommended in ${weakSubjects.join(', ')}`
          : cgpa < 6 ? 'Below benchmark in recent mid-terms' : 'Consistent high performer';

        await Insight.create({
          studentId: studentUser._id, classId: cls._id,
          cgpa, riskLevel, dropoutScore, riskReason,
          recommendations: [
            riskLevel !== 'low' ? `Focus on mastering ${weakSubjects[0] || 'core subjects'}` : 'Continue maintaining strong focus streaks',
            'Complete assigned adaptive AI quizzes',
            'Review video flashcards on Ultra Keeper'
          ],
          semester: 5
        });

        if (riskLevel === 'critical' || riskLevel === 'high') {
          await Intervention.create({
            studentId: studentUser._id,
            triggerType: riskLevel === 'critical' ? 'auto_critical' : 'risk_threshold',
            message: `Hi ${firstName}, our AI detected pending learning gaps in ${weakSubjects[0] || 'your coursework'}. Launch your Overcome growth plan to resolve this.`,
            tags: ['performance', 'attendance'],
            urgency: riskLevel === 'critical' ? 'critical' : 'high',
            status: 'sent',
            outcome: 'pending',
            riskAtSend: dropoutScore
          });

          await StudyPlan.create({
            studentId: studentUser._id,
            planType: 'advanced',
            mode: 'intervention',
            topic: weakSubjects[0] || 'Core Concepts',
            title: `AI Remediation Plan for ${weakSubjects[0] || 'Core Concepts'}`,
            totalDays: 5,
            dailySessions: [
              { day: 1, date: '2025-05-10', topics: ['Fundamental Concepts'], activities: ['Video Breakdown'], resources: ['Textbook Summary'], completed: true },
              { day: 2, date: '2025-05-11', topics: ['Problem Solving'], activities: ['Interactive MCQ'], resources: ['Practice Set 1'], completed: false }
            ],
            progress: 25
          });
        }
      }

      cls.studentIds = studentIds;
      await cls.save();

      // Polls
      await Poll.create({
        classId: cls._id,
        question: `How confident are you with ${SUBJECTS_MAP[dept][0]} concepts for upcoming exams?`,
        options: ['100% Confident', 'Need Practice', 'Struggling with Theory', 'Need 1-on-1 Help'],
        isOpen: true,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        responses: [
          { studentId: studentIds[0], option: '100% Confident' },
          { studentId: studentIds[1], option: 'Need Practice' },
          { studentId: studentIds[2], option: '100% Confident' },
          { studentId: studentIds[3], option: 'Struggling with Theory' }
        ]
      });

      // Help Tickets
      await HelpTicket.create({
        studentId: studentIds[0],
        message: `Need additional resources and practice datasets for ${SUBJECTS_MAP[dept][0]}.`,
        category: 'Academic',
        urgency: 'medium',
        status: 'responded',
        response: 'Added practice question sets to your Ultra Keeper module.',
        respondedAt: new Date()
      });

      // Leaderboard
      const lbEntries = [];
      for (let i = 0; i < studentIds.length; i++) {
        const stud = await Student.findOne({ userId: studentIds[i] });
        const user = await User.findById(studentIds[i]);
        lbEntries.push({
          studentId: studentIds[i],
          name: user.name,
          score: (stud?.xp || 0) + rand(100, 500),
          xp: stud?.xp || 0,
          badges: stud?.badges || [],
          change: rand(-2, 2)
        });
      }
      lbEntries.sort((a, b) => b.score - a.score);
      lbEntries.forEach((e, i) => { e.rank = i + 1; });

      await Leaderboard.create({
        classId: cls._id, entries: lbEntries,
        updatedAt: new Date()
      });

      console.log(`  → Seeded 10 students with rich metrics for ${dept}`);
    }

    console.log('\n✅ Iris Plus Student OS Seed complete!');
    console.log('Login credentials: aarav.sharma.cse@sensei.edu / student123');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();

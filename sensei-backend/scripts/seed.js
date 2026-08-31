import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Import all models
import User from '../src/models/User.js';
import Insight from '../src/models/Insight.js';
import Marks from '../src/models/Marks.js';
import Leaderboard from '../src/models/Leaderboard.js';
import Class from '../src/models/Class.js';
import TeacherInsight from '../src/models/TeacherInsight.js';
import Attendance from '../src/models/Attendance.js';
import Assignment from '../src/models/Assignment.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvFilePath = path.join(__dirname, '../../dummy_users.csv');

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    console.log('Clearing old dynamic seed data...');
    // We only clear users from CSV to avoid deleting real users if any, 
    // but for a full seed, let's clear the collections entirely:
    await User.deleteMany({});
    await Insight.deleteMany({});
    await Marks.deleteMany({});
    await Leaderboard.deleteMany({});
    await Class.deleteMany({});
    await TeacherInsight.deleteMany({});
    await Attendance.deleteMany({});
    await Assignment.deleteMany({});

    const usersToCreate = [];

    // Parse CSV
    const stream = fs.createReadStream(csvFilePath).pipe(csvParser());
    for await (const row of stream) {
      if (!row.Email) continue;
      usersToCreate.push(row);
    }

    console.log(`Parsed ${usersToCreate.length} users from CSV.`);

    const subjectsByDept = {
      CSE: ['Computer Networks', 'Data Structures', 'Database Management', 'Operating Systems', 'Software Engineering'],
      IT: ['Web Development', 'Information Security', 'Cloud Computing', 'Data Science', 'Machine Learning'],
      BTECH: ['Engineering Mathematics', 'Physics', 'Mechanics', 'Electrical Basics', 'Thermodynamics'],
      AI: ['Deep Learning', 'Neural Networks', 'Natural Language Processing', 'Computer Vision', 'Reinforcement Learning'],
      All: ['General Administration']
    };

    let studentRank = 1;
    for (const data of usersToCreate) {
      let role = data.Role.toLowerCase();
      if (role === 'faculty') role = 'teacher';

      // Create User
      const user = await User.create({
        name: data.Name,
        email: data.Email,
        password: data.Password,
        role: role,
        department: data.Department,
        studentId: role === 'student' ? `${data.Department}2025${String(studentRank).padStart(3, '0')}` : undefined
      });

      console.log(`Created user: ${user.email} (${user.role})`);

      if (role === 'student') {
        const subjects = subjectsByDept[data.Department] || subjectsByDept['CSE'];
        
        // Generate random marks for student
        const subjectMarksList = subjects.map(sub => {
          const ut1 = Math.floor(Math.random() * 10) + 10; // 10-20
          const midSem = Math.floor(Math.random() * 15) + 15; // 15-30
          const ut2 = Math.floor(Math.random() * 10) + 10; // 10-20
          const endSem = Math.floor(Math.random() * 40) + 40; // 40-80
          const total = ut1 + midSem + ut2 + endSem;
          return {
            subject: sub,
            ut1, midSem, ut2, endSem,
            total,
            percentage: Math.round((total / 150) * 100)
          };
        });

        const dummyClassId = new mongoose.Types.ObjectId();
        
        for (const markData of subjectMarksList) {
          await Marks.create({
            studentId: user._id,
            classId: dummyClassId,
            subject: markData.subject,
            semester: 5,
            ut1: markData.ut1,
            midSem: markData.midSem,
            ut2: markData.ut2,
            endSem: markData.endSem,
            total: markData.total,
            percentage: markData.percentage
          });
        }

        // Insight Data
        const avgPercentage = subjectMarksList.reduce((acc, curr) => acc + curr.percentage, 0) / subjects.length;
        const cgpa = (avgPercentage / 10).toFixed(2);
        const riskLevel = avgPercentage > 75 ? 'low' : avgPercentage > 60 ? 'medium' : avgPercentage > 40 ? 'high' : 'critical';

        await Insight.create({
          studentId: user._id,
          cgpa: parseFloat(cgpa),
          avgAttendance: Math.floor(Math.random() * 30) + 70, // 70-100%
          dropoutProbability: Math.floor(Math.random() * 20) + (riskLevel === 'critical' ? 50 : 0),
          riskLevel: riskLevel,
          riskReason: riskLevel === 'low' ? 'Performing well globally.' : 'Needs attention in specific core subjects.',
          recommendations: ['Focus on active recall', 'Attend extra lab sessions'],
          marksTrend: {
            labels: ['ut1', 'midSem', 'ut2', 'endSem'],
            datasets: subjects.map(s => ({
              label: s,
              data: [Math.floor(Math.random()*20), Math.floor(Math.random()*30), Math.floor(Math.random()*20), Math.floor(Math.random()*80)]
            }))
          }
        });

        // Leaderboard
        await Leaderboard.create({
          studentId: user._id,
          classId: dummyClassId,
          department: data.Department,
          rank: studentRank++,
          score: Math.floor(avgPercentage * 10),
          totalXP: Math.floor(Math.random() * 5000) + 1000
        });

      } else if (role === 'teacher') {
        const subjects = subjectsByDept[data.Department] || [];
        if (subjects.length > 0) {
          await Class.create({
            teacherId: user._id,
            name: `${data.Department} Section A`,
            semester: 5,
            subject: subjects[0],
            department: data.Department,
            studentCount: 60,
            averagePerformance: 75 + Math.floor(Math.random() * 15)
          });
        }

        await TeacherInsight.create({
          teacherId: user._id,
          overallClassPerformance: 78,
          studentsAtRisk: Math.floor(Math.random() * 10),
          engagementScore: 85,
          topPerformingSubject: subjects[0] || 'General',
          needsAttentionSubject: subjects[1] || 'General',
          workloadAlert: false
        });
      }
    }

    // Seed Assignments for Teachers & Submissions for Students
    console.log('Seeding assignments and submissions...');
    const teachers = await User.find({ role: 'teacher' });
    const students = await User.find({ role: 'student' });

    for (const teacher of teachers) {
      const subjects = subjectsByDept[teacher.department] || [];
      // Create at least one assignment per teacher subject
      for (const subject of subjects.slice(0, 2)) {
        await Assignment.create({
          teacherId: teacher._id,
          title: `${subject} Mid-Term Assessment`,
          brief: `Comprehensive review of ${subject} concepts from week 1-8. Expected 2000 words.`,
          subject: subject,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'active',
          submissions: students.filter(s => s.department === teacher.department).map(s => ({
            studentId: s._id,
            content: `This is a simulated submission for ${subject} with AI-generated insights.`,
            submittedAt: new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000),
            grade: 70 + Math.floor(Math.random() * 25),
            aiScore: Math.floor(Math.random() * 40),
            plagiarismScore: Math.floor(Math.random() * 15),
            feedback: "Excellent analysis. Consider expanding on the practical applications in the next iteration.",
            status: 'graded',
            historyContext: {
              trend: Math.random() > 0.6 ? 'improving' : 'stable',
              growthScore: 65 + Math.floor(Math.random() * 30),
              aiMemory: `Student is showing a consistent positive trend in ${subject}. Their grasp of core concepts has improved significantly since UT1.`
            }
          }))
        });
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();

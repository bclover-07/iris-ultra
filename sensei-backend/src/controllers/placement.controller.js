import Job from '../models/Job.js';
import User from '../models/User.js';
import Insight from '../models/Insight.js';
import { getStudentPerformance } from '../services/performance.service.js';

export const getJobs = async (req, res) => {
  try {
    let jobs = await Job.find().sort({ createdAt: -1 });
    if (jobs.length === 0) {
      const students = await User.find({ role: 'student' }).limit(3);
      const defaultJobs = [
        {
          title: 'Software Engineer Intern',
          company: 'Google',
          type: 'Internship',
          location: 'Bangalore',
          salary: '₹1,00,000/mo',
          deadline: '2026-08-30',
          description: 'Work on search infrastructure and cloud computing APIs. Requires strong DS/Algo and systems knowledge.',
          status: 'open',
          applicants: students.map((s, index) => ({
            studentId: s._id,
            status: index % 2 === 0 ? 'applied' : 'approved',
            matchScore: 92 - (index * 5),
            appliedAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000))
          }))
        },
        {
          title: 'Frontend Developer',
          company: 'Meta',
          type: 'Full-time',
          location: 'Remote',
          salary: '₹80,000/mo',
          deadline: '2026-07-15',
          description: 'Build next-gen user interfaces using React and Tailwind. Collaborate with designers and product managers.',
          status: 'open',
          applicants: students.slice(0, 2).map((s, index) => ({
            studentId: s._id,
            status: 'applied',
            matchScore: 88 - (index * 4),
            appliedAt: new Date(Date.now() - (index * 12 * 60 * 60 * 1000))
          }))
        },
        {
          title: 'Data Analyst',
          company: 'Netflix',
          type: 'Full-time',
          location: 'Mumbai',
          salary: '₹75,000/mo',
          deadline: '2026-07-20',
          description: 'Analyze user engagement and content performance metrics using SQL and Python. Build interactive dashboards.',
          status: 'in_review',
          applicants: students.slice(1, 3).map((s, index) => ({
            studentId: s._id,
            status: 'applied',
            matchScore: 85 - (index * 3),
            appliedAt: new Date(Date.now() - (index * 2 * 24 * 60 * 60 * 1000))
          }))
        }
      ];
      jobs = await Job.create(defaultJobs);
    }

    const mappedJobs = jobs.map(j => {
      const obj = j.toObject();
      return {
        ...obj,
        applicants: obj.applicants.length
      };
    });

    res.status(200).json({ success: true, jobs: mappedJobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const { title, company, type, location, salary, deadline, description } = req.body;
    const job = await Job.create({
      title, company, type, location, salary, deadline, description, status: 'open', applicants: []
    });
    res.status(201).json({ success: true, job: { ...job.toObject(), applicants: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId).populate('applicants.studentId');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    const mockSkills = [
      ['React', 'Node.js', 'TypeScript', 'MongoDB'],
      ['Python', 'SQL', 'Tableau', 'Excel'],
      ['C++', 'Java', 'Data Structures', 'Algorithms'],
      ['Flutter', 'Dart', 'Firebase', 'State Management'],
      ['HTML', 'CSS', 'JavaScript', 'UX Design']
    ];

    const mappedApplicants = await Promise.all(job.applicants.map(async (app, idx) => {
      const student = app.studentId;
      if (!student) return null;

      const perf = await getStudentPerformance(student._id);
      const insight = await Insight.findOne({ studentId: student._id });

      return {
        _id: student._id,
        name: student.name,
        cgpa: perf.cgpa || 8.2,
        skills: mockSkills[idx % mockSkills.length],
        matchScore: app.matchScore || 85,
        risk: insight?.riskLevel || perf.risk?.level || 'low',
        status: app.status
      };
    }));

    res.status(200).json({
      success: true,
      applicants: mappedApplicants.filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateApplicantStatus = async (req, res) => {
  try {
    const { jobId, studentId } = req.params;
    const { status } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const applicant = job.applicants.find(a => a.studentId.toString() === studentId);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found' });
    }

    applicant.status = status;
    await job.save();

    res.status(200).json({ success: true, message: `Applicant status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import Exam from '../models/Exam.js';
import Class from '../models/Class.js';

export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find({ teacherId: req.user.userId }).sort({ createdAt: -1 });
    
    // Populate class names if needed, but since it's just basic info:
    const populatedExams = await Promise.all(exams.map(async (exam) => {
      const cls = await Class.findById(exam.classId);
      return {
        ...exam.toObject(),
        className: cls ? cls.name : 'Unknown Class',
        totalStudents: cls ? (cls.studentIds ? cls.studentIds.length : 0) : 0
      };
    }));

    res.json({ exams: populatedExams });
  } catch (error) {
    console.error('Get Exams Error:', error);
    res.status(500).json({ message: 'Failed to fetch exams', error: error.message });
  }
};

export const getExamsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const exams = await Exam.find({ teacherId: req.user.userId, classId }).sort({ createdAt: -1 });
    
    const cls = await Class.findById(classId);

    const populatedExams = exams.map(exam => ({
      ...exam.toObject(),
      className: cls ? cls.name : 'Unknown Class',
      totalStudents: cls ? (cls.studentIds ? cls.studentIds.length : 0) : 0
    }));

    res.json({ exams: populatedExams });
  } catch (error) {
    console.error('Get Exams By Class Error:', error);
    res.status(500).json({ message: 'Failed to fetch exams for class', error: error.message });
  }
};

export const scheduleExam = async (req, res) => {
  try {
    const { title, classId, subject, date, time, duration, maxMarks } = req.body;
    
    const newExam = new Exam({
      title,
      classId,
      subject,
      date,
      time,
      duration: duration || '2 hrs',
      maxMarks: maxMarks || 100,
      status: 'draft',
      teacherId: req.user.userId
    });

    await newExam.save();
    
    res.status(201).json({ message: 'Exam scheduled successfully', exam: newExam });
  } catch (error) {
    console.error('Schedule Exam Error:', error);
    res.status(500).json({ message: 'Failed to schedule exam', error: error.message });
  }
};

export const publishExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findOneAndUpdate(
      { _id: id, teacherId: req.user.userId },
      { status: 'scheduled' },
      { new: true }
    );
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json({ message: 'Exam published successfully', exam });
  } catch (error) {
    console.error('Publish Exam Error:', error);
    res.status(500).json({ message: 'Failed to publish exam', error: error.message });
  }
};

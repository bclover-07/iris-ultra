import Marks from '../models/Marks.js';
import Attendance from '../models/Attendance.js';
import Insight from '../models/Insight.js';

export const getReports = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const marks = await Marks.find({ studentId }).sort({ createdAt: -1 });
    const attendance = await Attendance.find({ studentId });
    const insight = await Insight.findOne({ studentId });

    res.json({
      marks,
      attendance,
      insight,
      status: 'active'
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const generateReport = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const insight = await Insight.findOne({ studentId });
    res.status(200).json({ message: 'Academic diagnostic report generated', insight });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

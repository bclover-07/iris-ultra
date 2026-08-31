import ScheduledEvent from '../models/ScheduledEvent.js';

export const getEvents = async (req, res) => {
  try {
    const events = await ScheduledEvent.find({ teacherId: req.user.userId }).sort({ date: 1, time: 1 });
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { title, type, date, time, className, subject, location, attendees, urgency } = req.body;
    
    const newEvent = await ScheduledEvent.create({
      title,
      type,
      date,
      time,
      className,
      subject,
      location,
      attendees,
      urgency,
      teacherId: req.user.userId
    });

    res.status(201).json({ event: newEvent });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
};

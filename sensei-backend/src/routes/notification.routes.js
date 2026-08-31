import express from 'express';
import Notification from '../models/Notification.js';
import { verifyAccessToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all notifications for the current user
router.get('/', verifyAccessToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Create a notification
router.post('/', verifyAccessToken, async (req, res) => {
  try {
    const { title, message, type, link } = req.body;
    const notification = new Notification({
      userId: req.user.userId,
      title,
      message,
      type: type || 'info',
      link
    });
    await notification.save();

    // Emit to socket
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.userId.toString()).emit('notification:new', notification);
    }

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

// Mark as read
router.put('/:id/read', verifyAccessToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
});

// Mark all as read
router.put('/read-all', verifyAccessToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
  }
});

export default router;

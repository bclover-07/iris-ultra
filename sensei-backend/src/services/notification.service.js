import Notification from '../models/Notification.js';
import getIO from '../config/socket.js';

export const createNotification = async (userId, { type = 'info', title, message, link }) => {
  const notification = await Notification.create({
    userId, type, title, message, link
  });

  try {
    const io = getIO();
    const namespace = '/student';
    io.of(namespace).to(userId.toString()).emit('notification:new', notification);
  } catch (e) {}

  return notification;
};

export const getUserNotifications = async (userId, limit = 20) => {
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  
  return { notifications, unreadCount };
};

export const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};

export default { createNotification, getUserNotifications, markAsRead };

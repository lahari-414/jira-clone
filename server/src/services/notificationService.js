const notificationRepository = require('../repositories/notificationRepository');

const notificationService = {
  async notify({ userId, type, title, message, issueId }) {
    if (!userId) return null;
    return notificationRepository.create({ userId, type, title, message, issueId });
  },

  async list(userId) {
    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.findByUser(userId),
      notificationRepository.countUnread(userId),
    ]);
    return { notifications, unreadCount };
  },

  markRead: (id, userId) => notificationRepository.markRead(id, userId),
  markAllRead: (userId) => notificationRepository.markAllRead(userId),
};

module.exports = notificationService;

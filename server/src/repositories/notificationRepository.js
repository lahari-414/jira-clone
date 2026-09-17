const prisma = require('../config/db');

const notificationRepository = {
  create: (data) => prisma.notification.create({ data }),
  createMany: (data) => prisma.notification.createMany({ data }),
  findByUser: (userId) =>
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
  countUnread: (userId) => prisma.notification.count({ where: { userId, isRead: false } }),
  markRead: (id, userId) =>
    prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } }),
  markAllRead: (userId) =>
    prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } }),
};

module.exports = notificationRepository;

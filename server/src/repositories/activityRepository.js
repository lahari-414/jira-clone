const prisma = require('../config/db');

const activityRepository = {
  create: (data) => prisma.activity.create({ data, include: { user: true } }),
  findByIssue: (issueId) =>
    prisma.activity.findMany({
      where: { issueId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    }),
};

module.exports = activityRepository;

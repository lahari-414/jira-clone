const prisma = require('../config/db');

const adminService = {
  async stats() {
    const [users, projects, issues] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.issue.count(),
    ]);
    return { users, projects, issues };
  },

  // A lightweight audit trail built from Activity + auth-relevant events.
  async auditLog() {
    return prisma.activity.findMany({
      include: { user: true, issue: { include: { project: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },
};

module.exports = adminService;

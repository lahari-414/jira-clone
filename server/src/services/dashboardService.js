const prisma = require('../config/db');

const dashboardService = {
  async getSummary(user) {
    const projectFilter =
      user.role === 'ADMIN' ? {} : { project: { members: { some: { userId: user.id } } } };

    const [
      totalProjects,
      openIssues,
      completedIssues,
      highPriorityIssues,
      myIssues,
      byStatus,
      byPriority,
      byType,
      activeSprints,
      recentActivity,
      recentComments,
    ] = await Promise.all([
      prisma.project.count(
        user.role === 'ADMIN' ? {} : { where: { members: { some: { userId: user.id } } } }
      ),
      prisma.issue.count({ where: { ...projectFilter, status: { not: 'DONE' } } }),
      prisma.issue.count({ where: { ...projectFilter, status: 'DONE' } }),
      prisma.issue.count({ where: { ...projectFilter, priority: { in: ['HIGH', 'HIGHEST'] }, status: { not: 'DONE' } } }),
      prisma.issue.findMany({
        where: { assigneeId: user.id, status: { not: 'DONE' } },
        include: { project: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.issue.groupBy({ by: ['status'], where: projectFilter, _count: true }),
      prisma.issue.groupBy({ by: ['priority'], where: projectFilter, _count: true }),
      prisma.issue.groupBy({ by: ['issueType'], where: projectFilter, _count: true }),
      prisma.sprint.findMany({
        where: { status: 'ACTIVE', ...(user.role === 'ADMIN' ? {} : { project: { members: { some: { userId: user.id } } } }) },
        include: { project: true, _count: { select: { issues: true } } },
      }),
      prisma.activity.findMany({
        where: user.role === 'ADMIN' ? {} : { issue: projectFilter },
        include: { user: true, issue: { include: { project: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      prisma.comment.findMany({
        where: user.role === 'ADMIN' ? {} : { issue: projectFilter },
        include: { author: true, issue: { include: { project: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    return {
      totals: { totalProjects, openIssues, completedIssues, highPriorityIssues },
      myIssues,
      charts: { byStatus, byPriority, byType },
      activeSprints,
      recentActivity,
      recentComments,
    };
  },
};

module.exports = dashboardService;

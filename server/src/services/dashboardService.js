const prisma = require('../config/db');

const dashboardService = {
  async getSummary(user) {
    const projectFilter =
      ['ADMIN', 'HR'].includes(user.role) ? {} : { project: { members: { some: { userId: user.id } } } };

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
        ['ADMIN', 'HR'].includes(user.role) ? {} : { where: { members: { some: { userId: user.id } } } }
      ),
      prisma.issue.count({ where: { ...projectFilter, status: { not: 'DONE' } } }),
      prisma.issue.count({ where: { ...projectFilter, status: 'DONE' } }),
      prisma.issue.count({ where: { ...projectFilter, priority: { in: ['HIGH', 'HIGHEST', 'CRITICAL'] }, status: { not: 'DONE' } } }),
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
        where: { status: 'ACTIVE', ...(['ADMIN', 'HR'].includes(user.role) ? {} : { project: { members: { some: { userId: user.id } } } }) },
        include: { project: true, _count: { select: { issueLinks: true } } },
      }),
      prisma.activity.findMany({
        where: ['ADMIN', 'HR'].includes(user.role) ? {} : { issue: projectFilter },
        include: { user: true, issue: { include: { project: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.comment.findMany({
        where: ['ADMIN', 'HR'].includes(user.role) ? {} : { issue: projectFilter },
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

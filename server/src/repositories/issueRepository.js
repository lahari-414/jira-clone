const prisma = require('../config/db');

const issueInclude = {
  reporter: true,
  assignee: true,
  project: true,
  sprint: true,
  labels: { include: { label: true } },
  _count: { select: { comments: true, attachments: true } },
};

const issueRepository = {
  // Uses a transaction to atomically compute the next issue number per project
  createForProject: (projectId, data) =>
    prisma.$transaction(async (tx) => {
      const last = await tx.issue.findFirst({
        where: { projectId },
        orderBy: { issueNumber: 'desc' },
        select: { issueNumber: true },
      });
      const issueNumber = (last?.issueNumber || 0) + 1;
      return tx.issue.create({
        data: { ...data, projectId, issueNumber },
        include: issueInclude,
      });
    }),
  findById: (id) => prisma.issue.findUnique({ where: { id }, include: issueInclude }),
  findManyByProject: (projectId, where = {}) =>
    prisma.issue.findMany({
      where: { projectId, ...where },
      include: issueInclude,
      orderBy: { createdAt: 'desc' },
    }),
  findBoardIssues: (projectId) =>
    prisma.issue.findMany({
      where: { projectId, status: { not: 'BACKLOG' } },
      include: issueInclude,
      orderBy: { createdAt: 'asc' },
    }),
  findBacklogIssues: (projectId) =>
    prisma.issue.findMany({
      where: { projectId, OR: [{ sprintId: null }, { sprint: { status: 'PLANNED' } }] },
      include: issueInclude,
      orderBy: { createdAt: 'desc' },
    }),
  update: (id, data) => prisma.issue.update({ where: { id }, data, include: issueInclude }),
  delete: (id) => prisma.issue.delete({ where: { id } }),
  search: (where) =>
    prisma.issue.findMany({ where, include: issueInclude, orderBy: { updatedAt: 'desc' }, take: 50 }),
  countByStatus: (projectId) =>
    prisma.issue.groupBy({ by: ['status'], where: { projectId }, _count: true }),
};

module.exports = issueRepository;

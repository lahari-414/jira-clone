const prisma = require('../config/db');

const sprintRepository = {
  create: (data) => prisma.sprint.create({ data }),
  findById: (id) => prisma.sprint.findUnique({
    where: { id },
    include: {
      project: true,
      incident: true,
      issueLinks: {
        include: {
          issue: {
            include: {
              project: true,
              assignee: true,
              reporter: true,
              sprintLinks: { include: { sprint: true } },
              labels: { include: { label: true } },
              _count: { select: { comments: true, attachments: true } },
            },
          },
        },
      },
    },
  }),
  findByProject: (projectId) =>
    prisma.sprint.findMany({ where: { projectId }, include: { incident: true, _count: { select: { issueLinks: true } } }, orderBy: [{ createdAt: 'desc' }, { startDate: { sort: 'desc', nulls: 'last' } }] }),
  findActiveByProject: (projectId) =>
    prisma.sprint.findFirst({ where: { projectId, status: 'ACTIVE' } }),
  update: (id, data) => prisma.sprint.update({ where: { id }, data }),
};

module.exports = sprintRepository;

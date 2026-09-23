const prisma = require('../config/db');

const sprintRepository = {
  create: (data) => prisma.sprint.create({ data }),
  findById: (id) => prisma.sprint.findUnique({ where: { id }, include: { issueLinks: { include: { issue: true } } } }),
  findByProject: (projectId) =>
    prisma.sprint.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } }),
  findActiveByProject: (projectId) =>
    prisma.sprint.findFirst({ where: { projectId, status: 'ACTIVE' } }),
  update: (id, data) => prisma.sprint.update({ where: { id }, data }),
};

module.exports = sprintRepository;

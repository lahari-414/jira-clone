const prisma = require('../config/db');

const projectRepository = {
  create: (data) => prisma.project.create({ data }),
  findById: (id) => prisma.project.findUnique({ where: { id } }),
  findByIdWithDetails: (id) =>
    prisma.project.findUnique({
      where: { id },
      include: {
        owner: true,
        members: { include: { user: true } },
        _count: { select: { issues: true, sprints: true } },
      },
    }),
  findByKey: (key) => prisma.project.findUnique({ where: { key } }),
  findMany: (params) => prisma.project.findMany(params),
  findManyForUser: (userId, role) => {
    if (role === 'ADMIN') return prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
    return prisma.project.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
  },
  update: (id, data) => prisma.project.update({ where: { id }, data }),
  archive: (id) => prisma.project.update({ where: { id }, data: { status: 'ARCHIVED' } }),
  delete: (id) => prisma.project.delete({ where: { id } }),
  addMember: (projectId, userId, projectRole) =>
    prisma.projectMember.create({ data: { projectId, userId, projectRole } }),
  updateMember: (projectId, userId, projectRole) =>
    prisma.projectMember.update({ where: { projectId_userId: { projectId, userId } }, data: { projectRole } }),
  removeMember: (projectId, userId) =>
    prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } }),
  findMembership: (projectId, userId) =>
    prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } }),
  listMembers: (projectId) =>
    prisma.projectMember.findMany({ where: { projectId }, include: { user: true } }),
};

module.exports = projectRepository;

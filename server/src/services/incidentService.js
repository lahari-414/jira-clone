const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

const incidentService = {
  list: (projectId) => prisma.incident.findMany({ where: { projectId }, include: { sprints: { select: { id: true, name: true, status: true } } }, orderBy: { createdAt: 'desc' } }),
  async update(id, data) {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) throw ApiError.notFound('Incident not found');
    return prisma.incident.update({ where: { id }, data: { ...(data.title !== undefined ? { title: data.title.trim() } : {}), ...(data.description !== undefined ? { description: data.description || null } : {}), ...(data.status !== undefined ? { status: data.status } : {}), ...(data.priority !== undefined ? { priority: data.priority } : {}) } });
  },
};
module.exports = incidentService;

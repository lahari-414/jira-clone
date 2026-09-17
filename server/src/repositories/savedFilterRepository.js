const prisma = require('../config/db');

const savedFilterRepository = {
  create: (data) => prisma.savedFilter.create({ data }),
  findByUser: (userId) => prisma.savedFilter.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  delete: (id, userId) => prisma.savedFilter.deleteMany({ where: { id, userId } }),
};

module.exports = savedFilterRepository;

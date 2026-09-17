const prisma = require('../config/db');

module.exports = {
  list: (issueId) => prisma.attachment.findMany({
    where: { issueId }, include: { uploadedBy: true }, orderBy: { createdAt: 'desc' },
  }),
  create: (data) => prisma.attachment.create({ data, include: { uploadedBy: true } }),
  findById: (id) => prisma.attachment.findUnique({ where: { id } }),
  remove: (id) => prisma.attachment.delete({ where: { id } }),
};

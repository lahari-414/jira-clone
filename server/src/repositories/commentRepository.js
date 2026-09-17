const prisma = require('../config/db');

const commentRepository = {
  create: (data) => prisma.comment.create({ data, include: { author: true } }),
  findById: (id) => prisma.comment.findUnique({ where: { id } }),
  findByIssue: (issueId) =>
    prisma.comment.findMany({
      where: { issueId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    }),
  update: (id, content) =>
    prisma.comment.update({ where: { id }, data: { content }, include: { author: true } }),
  delete: (id) => prisma.comment.delete({ where: { id } }),
};

module.exports = commentRepository;

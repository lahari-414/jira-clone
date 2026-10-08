const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

const include = { author: { select: { id: true, name: true, avatar: true } }, comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true, avatar: true } } } }, _count: { select: { comments: true } } };
module.exports = {
  list: (userId, isAdmin) => prisma.idea.findMany({ where: isAdmin ? {} : { authorId: userId }, include, orderBy: { createdAt: 'desc' } }),
  create: (authorId, { title, content }) => prisma.idea.create({ data: { authorId, title: title.trim(), content: content.trim() }, include }),
  async comment(ideaId, authorId, content, isAdmin) {
    const idea = await prisma.idea.findUnique({ where: { id: ideaId }, select: { id: true, authorId: true } });
    if (!idea || (!isAdmin && idea.authorId !== authorId)) throw ApiError.notFound('Idea not found');
    return prisma.ideaComment.create({ data: { ideaId, authorId, content: content.trim() }, include: { author: { select: { id: true, name: true, avatar: true } } } });
  },
};

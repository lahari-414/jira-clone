const prisma = require('../config/db');

const userRepository = {
  create: (data) => prisma.user.create({ data }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findMany: (params) => prisma.user.findMany(params),
  count: (where) => prisma.user.count({ where }),
  update: (id, data) => prisma.user.update({ where: { id }, data }),
  setActive: (id, isActive) => prisma.user.update({ where: { id }, data: { isActive } }),
  setDeleted: (id, isDeleted) => prisma.user.update({ where: { id }, data: { isDeleted } }),
};

module.exports = userRepository;

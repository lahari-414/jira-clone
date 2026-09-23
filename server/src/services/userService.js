const userRepository = require('../repositories/userRepository');
const { hashPassword } = require('../utils/password');
const { sanitizeUser } = require('../utils/sanitizeUser');
const ApiError = require('../utils/ApiError');

const userService = {
  async list({ page = 1, limit = 20, search, deleted = 'false' }) {
    const where = { isDeleted: String(deleted) === 'true' };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
    const [users, total] = await Promise.all([
      userRepository.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      userRepository.count(where),
    ]);
    return { users: users.map(sanitizeUser), total, page: Number(page), limit: Number(limit) };
  },

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    return sanitizeUser(user);
  },

  async createByAdmin({ name, email, password, role }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw ApiError.conflict('An account with this email already exists');
    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({ name, email, passwordHash, role });
    return sanitizeUser(user);
  },

  async update(id, data) {
    const allowed = (({ name, email, avatar, role }) => ({ name, email, avatar, role }))(data);
    Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);
    if (allowed.email) {
      const existing = await userRepository.findByEmail(allowed.email);
      if (existing && existing.id !== id) throw ApiError.conflict('An account with this email already exists');
    }
    const user = await userRepository.update(id, allowed);
    return sanitizeUser(user);
  },

  async setStatus(id, isActive) {
    const user = await userRepository.setActive(id, isActive);
    return sanitizeUser(user);
  },

  async setDeleted(id, isDeleted) {
    const user = await userRepository.setDeleted(id, isDeleted);
    return sanitizeUser(user);
  },
};

module.exports = userService;

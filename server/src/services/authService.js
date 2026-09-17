const userRepository = require('../repositories/userRepository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { sanitizeUser } = require('../utils/sanitizeUser');
const ApiError = require('../utils/ApiError');

const authService = {
  async register({ name, email, password }) {
    // Registration exists only to bootstrap an empty installation. Once the
    // workspace has an administrator, new accounts must be provisioned there.
    if ((await userRepository.count({})) > 0) {
      throw ApiError.forbidden('Accounts are created by an administrator. Please ask your workspace admin for access.');
    }
    const existing = await userRepository.findByEmail(email);
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({
      name,
      email,
      passwordHash,
      role: 'ADMIN',
    });

    const token = signToken({ sub: user.id, role: user.role });
    return { user: sanitizeUser(user), token };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Invalid email or password');

    const token = signToken({ sub: user.id, role: user.role });
    return { user: sanitizeUser(user), token };
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findById(userId);
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw ApiError.badRequest('Current password is incorrect');

    const passwordHash = await hashPassword(newPassword);
    await userRepository.update(userId, { passwordHash });
    return { success: true };
  },

  async updateProfile(userId, data) {
    const allowed = (({ name, avatar }) => ({ name, avatar }))(data);
    const user = await userRepository.update(userId, allowed);
    return sanitizeUser(user);
  },
};

module.exports = authService;

const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/db');

// Verifies the JWT and attaches the authenticated user to req.user
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token missing');
    }
    const token = header.split(' ')[1];
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account is inactive or does not exist');
    }
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

// Restricts a route to specific platform-level roles
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authenticate, authorize };

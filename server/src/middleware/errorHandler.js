const ApiError = require('../utils/ApiError');

// Maps known Prisma error codes to friendly ApiErrors
function mapPrismaError(err) {
  if (err.code === 'P2002') {
    const fields = err.meta?.target ?? [];
    return ApiError.conflict(`A record with this ${fields.join(', ') || 'value'} already exists`);
  }
  if (err.code === 'P2025') {
    return ApiError.notFound('Record not found');
  }
  if (err.code === 'P2003') {
    return ApiError.badRequest('Invalid reference to a related record');
  }
  return null;
}

// Centralized error handler — last middleware in the chain
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (err.name === 'MulterError') {
    error = ApiError.badRequest(err.code === 'LIMIT_FILE_SIZE' ? 'Files must be 10 MB or smaller' : err.message);
  }

  if (err.code && err.code.startsWith('P')) {
    error = mapPrismaError(err) || ApiError.internal('Database error');
  }

  if (!(error instanceof ApiError)) {
    error = ApiError.internal(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    );
  }

  if (error.statusCode >= 500) {
    console.error(err);
  }

  const body = { success: false, message: error.message };
  if (error.details) body.errors = error.details;
  if (process.env.NODE_ENV !== 'production' && error.statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(body);
}

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

module.exports = { errorHandler, notFoundHandler };

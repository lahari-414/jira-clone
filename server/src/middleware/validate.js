const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after express-validator chains; turns validation failures into a 422
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.unprocessable('Validation failed', errors.array()));
  }
  next();
};

module.exports = validate;

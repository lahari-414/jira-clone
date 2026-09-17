const { body } = require('express-validator');

exports.createProjectRules = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('key')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Project key must be 2-10 characters')
    .matches(/^[A-Za-z][A-Za-z0-9_-]*$/)
    .withMessage('Project key must start with a letter and use only letters, numbers, hyphens, or underscores'),
];

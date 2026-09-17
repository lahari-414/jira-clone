const { body } = require('express-validator');

exports.createSprintRules = [body('name').trim().notEmpty().withMessage('Sprint name is required')];

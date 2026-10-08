const { body } = require('express-validator');

exports.createSprintRules = [
  body('name').trim().notEmpty().withMessage('Sprint name is required'),
  body('startDate').notEmpty().withMessage('Start date is required').isISO8601(),
  body('startTime').notEmpty().withMessage('Start time is required').matches(/^\d{2}:\d{2}$/),
  body('endDate').notEmpty().withMessage('End date is required').isISO8601(),
  body('endTime').notEmpty().withMessage('End time is required').matches(/^\d{2}:\d{2}$/),
];

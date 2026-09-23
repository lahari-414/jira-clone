const { body } = require('express-validator');

exports.createIssueRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('issueType').optional().isIn(['TASK', 'BUG', 'STORY', 'EPIC', 'IMPROVEMENT']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'HIGHEST', 'CRITICAL']),
  body('status').optional().isIn(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'ON_HOLD', 'DONE']),
  body('sprintIds').optional().isArray(),
];

exports.changeStatusRules = [
  body('status').isIn(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'ON_HOLD', 'DONE']),
];

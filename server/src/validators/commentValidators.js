const { body } = require('express-validator');

exports.commentRules = [body('content').trim().notEmpty().withMessage('Comment cannot be empty')];

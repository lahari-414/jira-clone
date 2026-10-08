const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const ideaService = require('../services/ideaService');
exports.list = asyncHandler(async (req, res) => success(res, { ideas: await ideaService.list(req.user.id, req.user.role === 'ADMIN') }));
exports.create = asyncHandler(async (req, res) => success(res, { idea: await ideaService.create(req.user.id, req.body) }, 201));
exports.comment = asyncHandler(async (req, res) => success(res, { comment: await ideaService.comment(req.params.id, req.user.id, req.body.content, req.user.role === 'ADMIN') }, 201));

const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const attachmentService = require('../services/attachmentService');

exports.list = asyncHandler(async (req, res) => success(res, { attachments: await attachmentService.list(req.params.issueId) }));
exports.create = asyncHandler(async (req, res) => success(res, { attachment: await attachmentService.create(req.params.issueId, req.user.id, req.file) }, 201));
exports.remove = asyncHandler(async (req, res) => { await attachmentService.remove(req.params.attachmentId, req.user); success(res, { message: 'Attachment removed' }); });

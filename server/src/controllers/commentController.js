const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const commentService = require('../services/commentService');

exports.list = asyncHandler(async (req, res) => {
  const comments = await commentService.list(req.params.issueId);
  success(res, { comments });
});

exports.create = asyncHandler(async (req, res) => {
  const comment = await commentService.create(req.params.issueId, req.user.id, req.body.content);
  success(res, { comment }, 201);
});

exports.update = asyncHandler(async (req, res) => {
  const comment = await commentService.update(req.params.id, req.user.id, req.body.content);
  success(res, { comment });
});

exports.remove = asyncHandler(async (req, res) => {
  await commentService.delete(req.params.id, req.user);
  success(res, { message: 'Comment deleted' });
});
